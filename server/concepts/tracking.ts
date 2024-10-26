import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface TrackingDoc extends BaseDoc {
  target: string;
  counter: number;
}

/**
 * concept: Posting [Author]
 */
export default class TrackingConcept {
  public readonly track: DocCollection<TrackingDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.track = new DocCollection<TrackingDoc>(collectionName);
  }

  private async create(target: string) {
    const _id = await this.track.createOne({ target, counter: 0 });
    return this.track.readOne({ _id });
  }

  async getByTarget(target: string) {
    const tracker = await this.track.readOne({ target });
    if (!tracker) {
      return await this.create(target);
    }
    return tracker;
  }

  async update(target: string) {
    // Note that if counter or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    let tracker = await this.track.readOne({ target });
    if (!tracker) {
      tracker = await this.create(target);
    }
    if (tracker) {
      const currentDate = new Date();
      if (Math.floor((currentDate.getTime() - tracker.dateUpdated.getTime()) / (1000 * 3600 * 24)) > 3) tracker.counter = 0;
      await this.track.partialUpdateOne({ target }, { counter: tracker.counter + 1 });
      return { counter: tracker.counter + 1 };
    }
  }

  async reduce(target: string) {
    const tracker = await this.track.readOne({ target });
    if (!tracker) {
      throw new NotFoundError(`Tracker ${target} not found`);
    }
    return await this.track.partialUpdateOne({ target }, { counter: tracker.counter - 1 });
  }

  async delete(target: string) {
    return await this.track.deleteOne({ target });
  }
}
