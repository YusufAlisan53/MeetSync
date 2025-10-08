using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.EntityConfigurations;

public class MeetingUserConfiguration : IEntityTypeConfiguration<MeetingUser>
{
    public void Configure(EntityTypeBuilder<MeetingUser> builder)
    {
        builder.ToTable("MeetingUsers").HasKey(mu => mu.Id);

        builder.Property(mu => mu.Id).HasColumnName("Id").IsRequired();
        builder.Property(mu => mu.CreatedDate).HasColumnName("CreatedDate").IsRequired();
        builder.Property(mu => mu.UpdatedDate).HasColumnName("UpdatedDate");
        builder.Property(mu => mu.DeletedDate).HasColumnName("DeletedDate");
        builder.Property(mu => mu.Status).HasColumnName("Status").IsRequired();
        builder.Property(mu => mu.ResponseDate).HasColumnName("ResponseDate");

        builder.HasQueryFilter(mu => !mu.DeletedDate.HasValue);

        // Relationship: MeetingUser -> User
        builder.HasOne(mu => mu.User)
            .WithMany(u => u.MeetingUsers)
            .HasForeignKey(mu => mu.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: MeetingUser -> Meeting
        builder.HasOne(mu => mu.Meeting)
            .WithMany(m => m.Users)
            .HasForeignKey(mu => mu.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}