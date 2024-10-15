import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Checking, Friending, Posting, Sessioning, Tracking, Whitelisting } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    const aus = await Authing.create(username, password);
    if (aus.user) {
      await Whitelisting.create(aus.user._id, []);
      await Checking.create(aus.user._id);
    };
    return aus;
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    const list = await Whitelisting.getByOwner(user);
    if (list){
      Whitelisting.delete(list._id, user);
    }
    const chk = await Checking.getByOwner(user);
    if (chk) {
      Checking.delete(chk._id, user);
    }
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions, images?: string) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options, images);
    if (images) {
      const chk = await Checking.getByOwner(user);
      if (chk) await Checking.update(chk._id, images);
    }
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions, images?: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    if (images) {
      const post = await Posting.getOnePost(oid);
      const chk = await Checking.getByOwner(user);
      if (chk && post) {
        const old_image = post.images;
        await Checking.swap(chk._id, old_image, images);
      }
    }
    return await Posting.update(oid, content, options, images);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    const oldPost = await Posting.getOnePost(oid);
    const chkId = await Checking.getByOwner(user).then(response => response?._id);
    if (chkId && oldPost) await Checking.remove(chkId, oldPost.images)
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  // New
  @Router.patch("/whitelist/add")
  async addToWhitelist(session: SessionDoc, entry: string) {
    const user = Sessioning.getUser(session);
    const oldList = await Whitelisting.getByOwner(user);
    if (oldList){
      return await Whitelisting.add(oldList._id, entry);
    }
  }
  @Router.patch("/whitelist/remove")
  async removeFromWhitelist(session: SessionDoc, entry: string) {
    const user = Sessioning.getUser(session);
    const oldList = await Whitelisting.getByOwner(user);
    if (oldList){
      return await Whitelisting.remove(oldList._id, entry);
    }
  }
  @Router.get("/whitelist")
  async getWhitelist(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Whitelisting.getList(user);
  }
  @Router.get("/track/:target")
  async getTarget(target: string) {
    return await Tracking.getByTarget(target);
  }
  @Router.patch("/track/:target")
  async changeTarget(target: string) {
    return await Tracking.update(target);
  }
  @Router.delete("/track/:target")
  async deleteTarget(target: string) {
    return await Tracking.delete(target);
  }
  // @Router.get("/checkIm/:src")
  // async checkImg(src: string) {
  // }
  @Router.get("/checkIm/temp")
  async tempCheck(src: string) {
    return await Checking.tCheck(src);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
