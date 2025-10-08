namespace Application.Features.Meetings.Constants;

public static class MeetingsOperationClaims
{
    private const string _section = "Meetings";

    public const string Admin = $"{_section}.Admin";

    public const string Read = $"{_section}.Read";
    public const string Write = $"{_section}.Write";

    public const string Create = $"{_section}.Create";
    public const string Update = $"{_section}.Update";
    public const string Delete = $"{_section}.Delete";
    public const string Approve = $"{_section}.Approve";
    public const string CreateRequest = $"{_section}.CreateRequest";
    public const string Reject = $"{_section}.Reject";
    
    public const string GetUserMeetingsFromAuth = $"{_section}.GetUserMeetingsFromAuth";
    
    public const string GetRecommendedRoomsList = $"{_section}.GetRecommendedRoomsList";
}
