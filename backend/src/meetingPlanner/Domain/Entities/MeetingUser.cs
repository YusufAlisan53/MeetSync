using NArchitecture.Core.Persistence.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities;

public enum MeetingUserStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class MeetingUser : Entity<Guid>
{
    // Explicit foreign key properties to avoid shadow FK issues when inserting
    public Guid UserId { get; set; }
    public Guid MeetingId { get; set; }
    public MeetingUserStatus Status { get; set; } = MeetingUserStatus.Pending;
    public DateTime? ResponseDate { get; set; } = null;

    public virtual User User { get; set; } = default!;
    public virtual Meeting Meeting { get; set; } = default!;
}
