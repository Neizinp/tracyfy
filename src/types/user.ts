/**
 * A person, as git knows them. The user of the app is the git author of this
 * repository (user.name / user.email in .git/config); there are no user files.
 */
export interface Person {
  name: string;
  email: string;
}
