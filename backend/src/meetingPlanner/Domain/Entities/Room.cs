using NArchitecture.Core.Persistence.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities;

public class Room : Entity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string LocationInfo { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty ;
    public virtual ICollection<Meeting> Meetings { get; set; } = default!;
}


