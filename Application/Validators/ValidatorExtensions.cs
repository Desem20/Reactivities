using FluentValidation;

namespace Application.Validators
{
    public static class ValidatorExtensions
    {
      public static IRuleBuilder<T,string> Password<T>(this IRuleBuilder<T,string> 
      ruleBuilder)
      {
        var options = ruleBuilder
        .NotEmpty().MinimumLength(6).WithMessage("Password must be at least 6 characters")
        .Matches("[A-Z]").WithMessage("Password must contain at least 1 upercase letter")
        .Matches("[a-z]").WithMessage("Password must contain at least 1 lowercase character")
        .Matches("[0-9]").WithMessage("Password must contain a number")
        .Matches("[^a-zA-z0-9]").WithMessage("Password must contain non alphanumeric");
        return options;
      } 
    }
}