/**
 *    Copyright (c) ppy Pty Ltd <contact@ppy.sh>.
 *
 *    This file is part of osu!web. osu!web is distributed with the hope of
 *    attracting more community contributions to the core ecosystem of osu!.
 *
 *    osu!web is free software: you can redistribute it and/or modify
 *    it under the terms of the Affero GNU General Public License version 3
 *    as published by the Free Software Foundation.
 *
 *    osu!web is distributed WITHOUT ANY WARRANTY; without even the implied
 *    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *    See the GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with osu!web.  If not, see <http://www.gnu.org/licenses/>.
 */

import DispatcherAction from 'actions/dispatcher-action';
import { UserLogoutAction } from 'actions/user-login-actions';
import { CommentJSON } from 'interfaces/comment-json';
import { Dictionary, groupBy } from 'lodash';
import { action, observable } from 'mobx';
import { Comment } from 'models/comment';
import Store from 'stores/store';

export default class CommentStore extends Store {
  @observable comments = observable.map<number, Comment>();
  @observable userVotes = new Set<number>();
  private groupedByParentId: Dictionary<Comment[]> | null = null;

  @action
  addUserVote(comment: Comment) {
    this.userVotes.add(comment.id);
  }

  @action
  addVoted(commentIds: number[] | undefined | null) {
    if (commentIds == null) { return; }
    commentIds.forEach((value) => this.userVotes.add(value));
  }

  @action
  flushStore() {
    this.invalidate();
    this.comments.clear();
    this.userVotes.clear();
  }

  getCommentsByParentId(parentId: number | null) {
    // indexers get converted to string and null becomes "null".
    return this.getGroupedByParentId()[String(parentId)];
  }

  getGroupedByParentId() {
    if (this.groupedByParentId == null) {
      this.groupedByParentId = groupBy(Object.values(this.comments.toPOJO()), 'parent_id');
    }

    return this.groupedByParentId;
  }

  handleDispatchAction(dispatchedAction: DispatcherAction) {
    if (dispatchedAction instanceof UserLogoutAction) {
      this.flushStore();
    }
  }

  @action
  initialize(comments: CommentJSON[] | undefined | null, votes: number[] | undefined | null) {
    this.flushStore();
    this.addVoted(votes);
    this.updateWithJSON(comments);
  }

  @action
  removeUserVote(comment: Comment) {
    this.userVotes.delete(comment.id);
  }

  @action
  updateWithJSON(data: CommentJSON[] | undefined | null) {
    if (data == null) { return; }
    this.invalidate();
    for (const json of data) {
      const comment = Comment.fromJSON(json);
      this.comments.set(comment.id, comment);
    }
  }

  private invalidate() {
    this.groupedByParentId = null;
  }
}
