using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.EntityConfigurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications").HasKey(n => n.Id);

        builder.Property(n => n.Id).HasColumnName("Id").IsRequired();
        builder.Property(n => n.UserId).HasColumnName("UserId").IsRequired();
        builder.Property(n => n.Title).HasColumnName("Title").IsRequired().HasMaxLength(200);
        builder.Property(n => n.Message).HasColumnName("Message").IsRequired().HasMaxLength(1000);
        builder.Property(n => n.Type).HasColumnName("Type").IsRequired();
        builder.Property(n => n.IsRead).HasColumnName("IsRead").IsRequired().HasDefaultValue(false);
        builder.Property(n => n.CreatedDate).HasColumnName("CreatedDate").IsRequired();
        builder.Property(n => n.RelatedMeetingId).HasColumnName("RelatedMeetingId");
        builder.Property(n => n.DeletedDate).HasColumnName("DeletedDate");

        // Apply the same global query filter as User entity to maintain consistency
        builder.HasQueryFilter(n => !n.DeletedDate.HasValue);

        // Configure the relationship with User
        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

        // Configure the relationship with Meeting
        builder.HasOne(n => n.RelatedMeeting)
            .WithMany()
            .HasForeignKey(n => n.RelatedMeetingId)
            .OnDelete(DeleteBehavior.SetNull); // Set null if meeting is deleted

        builder.HasBaseType((string)null!);
    }
}
