var _logger = require("../lib/logger");

/// Save triggers

Parse.Cloud.afterSave(Parse.Role, async (request) => {
  var role = request.object;

  // TODO: Don't set the flag on users whose flag is already correct.
  // Set the `is_admin` flag on users in the admin role.
  if (role.getName() == 'admin') {
    var users = await role.getUsers().query().find({useMasterKey: true});
    for (let i = 0; i < users.length; i++) {
      var user = users[i];
      user.set('isAdmin', true);
      user.save(null, {useMasterKey: true});
    }
  }
});

Parse.Cloud.beforeSave(Parse.User, async (request) => {
  var user = request.object;
  var acl = user.getACL();

  if (!acl) {
    acl = new Parse.ACL(request.object.objectId);
    user.setACL(acl);
  }
  acl.setRoleReadAccess('admin', true);
  acl.setRoleWriteAccess('admin', true);
});

Parse.Cloud.beforeSave("Quiz", async (request) => {
  var currentUser = request.user;
  var quiz = request.object;
  if (request.original == null) {
    quiz.set("author", currentUser);
    if (currentUser.has("displayName")) {
      quiz.set("authorDisplayName", currentUser.get("displayName"));
    } else if (currentUser.has("username")) {
      quiz.set("authorDisplayName", currentUser.get("username"));
    }
  }

  // Remove whitespace in answers.
  var questions = quiz.get('questions');
  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    if (question.type == 3) {
      // Exact answer
      var answers = question.answer;
      for (var i = 0; i < answers.length; i++) {
        var answer = answers[i];
         answers[i] = answer.trim();
      }
    }
  }
},{
   fields : {
     name : {
       required: true,
       type: String,
       options: val => {
         return typeof val === 'string' && val.length > 0 && val.length <= 100;
       },
       error: "Quiz name length must be greater than 0 and less than or equal to 100"
     },
     description : {
       required: true,
       type: String,
       options: val => {
         return typeof val === 'string' && val.length > 0 && val.length <= 300;
       },
       error: "Quiz name length must be greater than 0 and less than or equal to 300"
     },
     questions : {
       required: true,
       type: Object,
       options: val => {
         if (!Array.isArray(val)) {
           throw new Error("Questions not stored as an array");
         }
         if (val.length = 0) {
           throw new Error("Quiz must contain at least one question");
         };
         for (var i = 0; i < val.length; i++) {
           var question = val[i];
           if (!question.prompt) {
             throw new Error("All questions must contain a prompt");
           }
           if (typeof question.prompt !== 'string') {
             throw new Error("Question prompt must be a string");
           }
           if (question.type == null) {
             throw new Error("All questions must contain a type");
           }
           if (question.type < 1 || question.type > 3) {
             throw new Error("All questions must have a valid type");
           }
           if (question.answer == null) {
             throw new Error("All questions must have an answer");
           }
           if (question.type == 1) {
             // T/F question.
             if (typeof question.answer !== 'boolean') {
               throw new Error("T/F questions must have boolean answer");
             }
           } else if (question.type == 2) {
             // Multiple choice
             if (!Array.isArray(question.answer) || question.answer.length == 0) {
               throw new Error("Multiple choice answers must be supplied in array");
             }
             if (!question.decoys || !Array.isArray(question.decoys) || question.decoys.length == 0) {
               throw new Error("Multiple choice decoys must be supplied in array");
             }
           } else if (question.type == 3) {
             // Exact answer
             if (!Array.isArray(question.answer) || question.answer.length == 0) {
               throw new Error("Exact answers must be supplied in array");
             }
           }
         }
         return true;
       },
     }
   }
 });

//Parse.Cloud.afterSave(Parse.User, async (request) => {
//  _logger.logger.info('[DELETEME] afterSave called for Parse.User.');
//  var user = request.object;
//  _logger.logger.info('[DELETEME] user = ' + user);
//  var isFacebookProvider = Parse.FacebookUtils.isLinked(user);
//  _logger.logger.info('[DELETEME] isFacebookProvider = ' + isFacebookProvider);
//  if (isFacebookProvider) {
//  // TODO: Support Google account provider.
//    /// Account providers:
//            /// 1: Parse
//            /// 2: Facebook
//            /// 3: Google
//    var accountProvider = isFacebookProvider ? 2 : 3;
//    _logger.logger.info('[DELETEME] accountProvider = ' + accountProvider);
//    if (user.get('accountProvider') != accountProvider) {
//      user.set('accountProvider', accountProvider);
//      _logger.logger.info('[DELETEME] Saving account provider');
//      user.save(null, {useMasterKey: true});
//    }
//  }
//});

//Parse.Cloud.beforeSave("Ingredient", async (request) => {
//  var original = request.original;
//  var ingredient = request.object;
//
//  var singularName = ingredient.get('nameSingular');
//  if (!singularName || singularName.length == 0) {
//    const message = 'Singular name is required.';
//    console.error(message);
//    throw new Error(message);
//  }
//
//  var pluralName = ingredient.get('namePlural');
//  if (!pluralName || pluralName.length == 0) {
//    const message = 'Plural name is required.';
//    console.error(message);
//    throw new Error(message);
//  }
//
//  var images = ingredient.get('images');
//  if (!images || images.length == 0) {
//    const message = 'Image is required.';
//    console.error(message);
//    throw new Error(message);
//  }
//
//  var description = ingredient.get('description');
//  if (description && description.length > 512) {
//    const message = 'Description must be less than 512 characters. Given description has ' + description.length + '.';
//    console.error(message);
//    throw new Error(message);
//  }
//
//  // Only admins may set/unset the canonical field.
//  if ((!original && ingredient.get('canonical')) || (original && original.get('canonical') != ingredient.get('canonical'))) {
//    var query = new Parse.Query(new Parse.Role()).equalTo('name', 'admin');
//    try {
//      var role = await query.first({useMasterKey: true});
//      var user = await role.getUsers().query().get(request.user.id, {useMasterKey: true});
//      console.log('User is authorized to change canonical field');
//    } catch (error) {
//      var message = 'User is not authorized to modify `canonical` field';
//      console.error(message);
//      throw message;
//    }
//  }
//
//  var acl = request.object.getACL();
//  if (!acl) {
//    acl = new Parse.ACL(request.user);
//    acl.setRoleReadAccess('admin', true);
//    acl.setRoleWriteAccess('admin', true);
//    acl.setPublicReadAccess(true);
//    ingredient.setACL(acl);
//  }
//});

/// Cloud functions

Parse.Cloud.define("sign_in_with_apple"), async (request) => {
  // TODO: redirect to android app. (Don't use on iOS).
  console.error('Received request: ' + request);
  return new Error('sign_in_with_apple is not implemented!');
}

Parse.Cloud.define("updateProfilePhoto", async (request) => {
  var user = request.user;
  var file = request.params.file;

  if (!user) {
    const message = 'Current user not found.';
    console.error(message);
    return new Error(message);
  }

  if (!file) {
    const message = 'Request must include file.';
    console.error(message);
    return new Error(message);
  }

  const currentPhoto = user.get('profilePhoto');
  user.set('profilePhoto', file);

  var updatedUser;
  try {
    updatedUser = await user.save(null, { useMasterKey: true });
  } catch (e) {
    const message = 'Unable to save profile photo: ' + e;
    console.error(message);
    return Error(message);
  }

  if (currentPhoto) {
    try {
      currentPhoto.destroy({ useMasterKey: true });
    } catch (e) {
      const message = 'Unable to destroy previous photo: ' + e;
      console.error(message);
    }
  }

  _logger.logger.info('Successfully updated user profile photo.');
  return updatedUser;
});

Parse.Cloud.define("listQuizzes", async (request) => {
  var user = request.user;
  var limit = request.params.limit ?? 20;
  var skip = request.params.skip ?? 0;
  var ascending = request.params.ascending;
  var descending = request.params.descending;

  if (!user) {
    const message = 'Current user not found.';
    console.error(message);
    return new Error(message);
  }

  if (typeof limit !== 'number' || limit < 10 || limit > 100) {
    const message = 'Invalid limit.';
    console.error(message);
    return new Error(message);
  }

  if (typeof skip !== 'number' || skip < 0) {
    const message = 'Invalid skip.';
    console.error(message);
    return new Error(message);
  }

  if (ascending != null) {
    if (!Array.isArray(ascending)) {
      const message = 'Invalid ascending.';
      console.error(message);
      return new Error(message);
    }
    for (var i = 0; i < ascending.length; i++) {
      if (typeof ascending[i] !== 'string') {
        const message = 'Invalid ascending.';
        console.error(message);
        return new Error(message);
      }
    }
  }

  if (descending != null) {
      if (!Array.isArray(descending)) {
        const message = 'Invalid descending.';
        console.error(message);
        return new Error(message);
      }
      for (var i = 0; i < descending.length; i++) {
        if (typeof descending[i] !== 'string') {
          const message = 'Invalid descending.';
          console.error(message);
          return new Error(message);
        }
      }
    }

  var query = new Parse.Query("Quiz");
  query.limit(limit);
  query.skip(skip);
//  query.equalTo('searchable', true);
  if (Array.isArray(ascending)) {
    query.addAscending(ascending);
  }
  if (Array.isArray(descending)) {
    query.addDescending(descending);
  }

  var results;
  try {
    results = await query.find({useMasterKey: true});
  } catch (error) {
    var message = 'Failed to fetch quizzes';
    console.error(message, ' due to error: ', error);
    throw message;
  }

  return results;
});