using NArchitecture.Core.Persistence.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities;
public class Meeting : Entity<Guid>
{
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public TimeSpan Duration { get; set; }
    public bool IsApproved { get; set; } = false; // Admin onayı
    public Guid? CreatedByUserId { get; set; } = null; // Toplantıyı oluşturan kullanıcı
    public Guid? ApprovedByUserId { get; set; } = null; // Onaylayan admin
    public DateTime? ApprovedDate { get; set; } = null; // Onaylanma tarihi
    public Guid? RoomId { get; set; } // Oda foreign key
    public virtual Room? Room { get; set; } // Required kaldırdım
    public virtual User? CreatedByUser { get; set; } // Toplantıyı oluşturan kullanıcı
    public virtual User? ApprovedByUser { get; set; } // Onaylayan admin
    public ICollection<MeetingUser> Users { get; set; } = default!;
}
