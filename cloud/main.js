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
    acl = new Parse.ACL(request.objecte.objectId);
    user.setACL(acl);
  }
  acl.setRoleReadAccess('admin', true);
  acl.setRoleWriteAccess('admin', true);
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
