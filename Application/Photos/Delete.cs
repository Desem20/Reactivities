using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
  public class Delete
  {
    public class Command : IRequest
    {
      public string Id { get; set; }
    }

    public class Handler : IRequestHandler<Command>
    {
      private readonly DataContext _context;
      private readonly Interfaces.IUserAccessor _userAccessor;
      private readonly Interfaces.IPhotoAccessor _photoAccessor;

      public Handler(DataContext context, Interfaces.IUserAccessor userAccessor,
      Interfaces.IPhotoAccessor photoAccessor)
      {
        this._photoAccessor = photoAccessor;
        this._userAccessor = userAccessor;
        this._context = context;
      }

    public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
    {
      var user = await _context.Users.SingleOrDefaultAsync(
          x=>x.UserName == _userAccessor.GetCurrentUsername());
      var photo = user.Photos.FirstOrDefault(x=>x.Id == request.Id);
      if(photo == null)
        throw new RestException(HttpStatusCode.NotFound, new {Photo="Not Found"});
      if(photo.IsMain)
        throw new RestException(HttpStatusCode.BadRequest, 
            new {Photos="you can't delete your main photo"});
      var result = _photoAccessor.DeletePhoto(photo.Id);
      if(result == null)
        throw new Exception("Problem deleting the photo");
      
      user.Photos.Remove(photo);          
      

      var success = await _context.SaveChangesAsync() > 0;
      if (success) return Unit.Value;
      throw new Exception("Problem saving Changes");
    }
  }
}
}