import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CheckingDoc extends BaseDoc {
  owner: ObjectId;
  images: string[];
}

interface SingleImDoc extends BaseDoc {
  owner: ObjectId;
  image: string;
}

/**
 * concept: Checking [owner]
 */
export default class CheckingConcept {
  public readonly chks: DocCollection<CheckingDoc>;
  public readonly ims: DocCollection<SingleImDoc>;

  /**
   * Make an instance of Checking.
   */
  constructor(collectionName: string) {
    this.chks = new DocCollection<CheckingDoc>(collectionName);
    this.ims = new DocCollection<SingleImDoc>(collectionName + "Ims");
  }

  async create(owner: ObjectId) {
    const _id = await this.chks.createOne({ owner, images: [] });
    return { msg: "Check successfully created!", check: await this.chks.readOne({ _id }) };
  }

  async getByOwner(owner: ObjectId) {
    return await this.chks.readOne({ owner });
  }

  async update(_id: ObjectId, image?: string) {
    // Note that if content or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    const chk = await this.chks.readOne({ _id });
    if (chk) {
      if (image) {
        chk.images.push(image);
        await this.ims.createOne({ owner: chk.owner, image });
      }
      await this.chks.partialUpdateOne({ _id }, { images: chk.images });
    }
    return { msg: "Check successfully updated!" };
  }

  async remove(_id: ObjectId, image?: string) {
    const chk = await this.chks.readOne({ _id });
    if (!chk) {
      throw new NotFoundError(`List ${_id} does not exist!`);
    }
    const newChecks = chk.images.filter((s) => s !== image);
    await this.chks.partialUpdateOne({ _id }, { images: newChecks });
    if (image) {
      await this.ims.deleteOne({ image });
    }
    return { msg: `Removed ${image} from List successfully!`, list: newChecks };
  }

  async swap(_id: ObjectId, old_image: string, new_image: string) {
    await this.remove(_id, old_image);
    await this.update(_id, new_image);
  }

  async delete(_id: ObjectId, user: ObjectId) {
    await this.assertOwnerIsUser(_id, user);
    await this.chks.deleteOne({ _id });
    await this.ims.deleteMany({ owner: user });
    return { msg: "Check deleted successfully!" };
  }

  async assertOwnerIsUser(_id: ObjectId, user: ObjectId) {
    const check = await this.chks.readOne({ _id });
    if (!check) {
      throw new NotFoundError(`Check ${_id} does not exist!`);
    }
    if (check.owner.toString() !== user.toString()) {
      throw new CheckOwnerNotMatchError(user, _id);
    }
  }

  async check(owner: ObjectId) {
    const ims = await this.getByOwner(owner);
    if (ims) {
      // let allMatch: string[] = [];
      let allMatch: SingleImDoc[] = [];
      for (const src of ims.images) {
        const posIm = await this.ims.readMany({ image: src });
        allMatch = allMatch.concat(posIm.filter((e) => e.owner.toString() !== owner.toString()));
      }
      return { list: allMatch };
    }
    return { list: [] };
  }

  private async download(src: string) {
    const finalUrl = this.parseUrl(src);
    return await this.readUrlData(finalUrl);
  }

  private async readUrlData(url: string) {
    const response = await fetch(url);
    if (!response.body) throw new NotFoundError("URL INVALID");

    const reader = response.body.getReader();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Do something with last chunk of data then exit reader
        return data;
      }
      // Otherwise do something here to process current chunk
      value.forEach((e) => {
        data += e.toString(16);
      });
    }
  }

  parseUrl(src: string) {
    const re = /\/([^\/]+.)\//gm;
    const parsed_src = src.match(re);
    let fileId = "";
    if (parsed_src && parsed_src.length == 2) {
      fileId = parsed_src[1].slice(1, -1);
    }
    return "https://drive.usercontent.google.com/download?id=" + fileId;
  }
}

export class CheckOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of {1}!", owner, _id);
  }
}
export class ImageExistsError extends NotAllowedError {
  constructor() {
    super("Image already exists");
  }
}
