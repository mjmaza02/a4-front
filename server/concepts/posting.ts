import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostOptions {
  backgroundColor?: string;
}

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  options?: PostOptions;
  images: string; // string storing location of file, may change to ObjectId later
  like: Array<ObjectId>;
  dislike: Array<ObjectId>;
}

/**
 * concept: Posting [Author]
 */
export default class PostingConcept {
  public readonly posts: DocCollection<PostDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.posts = new DocCollection<PostDoc>(collectionName);
  }

  async create(author: ObjectId, content: string, images: string, options?: PostOptions) {
    const _id = await this.posts.createOne({ author, content, options, images, like: new Array<ObjectId>(), dislike: new Array<ObjectId>() });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getPosts() {
    // Returns all posts! You might want to page for better client performance
    return await this.posts.readMany({}, { sort: { _id: -1 } });
  }

  async getOnePost(_id: ObjectId) {
    // Returns all posts! You might want to page for better client performance
    return await this.posts.readOne({ _id });
  }

  async getByAuthor(author: ObjectId) {
    return await this.posts.readMany({ author });
  }

  async update(_id: ObjectId, content?: string, options?: PostOptions, images?: string) {
    // Note that if content or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    if (images) await this.posts.partialUpdateOne({ _id }, { content, options, images });
    else await this.posts.partialUpdateOne({ _id }, { content, options });
    return { msg: "Post successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  async like(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (post) {
      if (post.like.filter((e) => e.toString() === user.toString()).length === 0) {
        const dislike = post.dislike.filter((e) => e.toString() !== user.toString());
        await this.posts.partialUpdateOne({ _id }, { dislike });
        post.like.push(user);
        await this.posts.partialUpdateOne({ _id }, { like: post.like });
      } else {
        const like = post.like.filter((e) => e.toString() !== user.toString());
        await this.posts.partialUpdateOne({ _id }, { like });
      }
    }
  }

  async dislike(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (post) {
      console.log(post.dislike.filter((e) => e.toString() === user.toString()));
      if (post.dislike.filter((e) => e.toString() === user.toString()).length === 0) {
        const like = post.like.filter((e) => e.toString() !== user.toString());
        await this.posts.partialUpdateOne({ _id }, { like });
        post.dislike.push(user);
        await this.posts.partialUpdateOne({ _id }, { dislike: post.dislike });
      } else {
        const dislike = post.dislike.filter((e) => e.toString() !== user.toString());
        await this.posts.partialUpdateOne({ _id }, { dislike });
      }
    }
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}

const p = new Set<ObjectId>();
p.add(new ObjectId());
