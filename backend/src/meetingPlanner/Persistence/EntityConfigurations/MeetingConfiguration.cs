using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.EntityConfigurations;

public class MeetingConfiguration : IEntityTypeConfiguration<Meeting>
{
    public void Configure(EntityTypeBuilder<Meeting> builder)
    {
        builder.ToTable("Meetings").HasKey(m => m.Id);

        builder.Property(m => m.Id).HasColumnName("Id").IsRequired();
        builder.Property(m => m.Subject).HasColumnName("Subject").IsRequired();
        builder.Property(m => m.Content).HasColumnName("Content").IsRequired();
        builder.Property(m => m.StartDate).HasColumnName("StartDate").IsRequired();
        builder.Property(m => m.Duration).HasColumnName("Duration").IsRequired();
        builder.Property(m => m.IsApproved).HasColumnName("IsApproved").IsRequired().HasDefaultValue(false);
        builder.Property(m => m.CreatedByUserId).HasColumnName("CreatedByUserId");
        builder.Property(m => m.ApprovedByUserId).HasColumnName("ApprovedByUserId");
        builder.Property(m => m.ApprovedDate).HasColumnName("ApprovedDate");
        builder.Property(m => m.RoomId).HasColumnName("RoomId");
        builder.Property(m => m.CreatedDate).HasColumnName("CreatedDate").IsRequired();
        builder.Property(m => m.UpdatedDate).HasColumnName("UpdatedDate");
        builder.Property(m => m.DeletedDate).HasColumnName("DeletedDate");

        builder.HasQueryFilter(m => !m.DeletedDate.HasValue);

        // Relationship: Meeting -> Room (many meetings can belong to one room)
        builder.HasOne(m => m.Room)
            .WithMany(r => r.Meetings)
            .HasForeignKey(m => m.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: Meeting -> CreatedByUser
        builder.HasOne(m => m.CreatedByUser)
            .WithMany()
            .HasForeignKey(m => m.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: Meeting -> ApprovedByUser
        builder.HasOne(m => m.ApprovedByUser)
            .WithMany()
            .HasForeignKey(m => m.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: Meeting -> MeetingUsers (one meeting has many meeting-users)
        builder.HasMany<MeetingUser>()
            .WithOne(mu => mu.Meeting)
         .HasForeignKey("MeetingId")
            .OnDelete(DeleteBehavior.Restrict);
    }
}