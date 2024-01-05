import { replicateRxCollection } from 'rxdb/plugins/replication';
import {
  RxReplicationPullStreamItem,
  lastOfArray
} from 'rxdb';
import { Subject } from 'rxjs';


export async function sync(myRxCollection: any) {
  /**
  * Creating the pull stream for realtime replication.
  * Here we use a websocket but any other way of sending data to the client can be used,
  * like long polling or server-send events.
  */
  const pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>();
  let firstOpen = true;
  function connectSocket() {
    const socket = new WebSocket('wss://example.com/api/sync/stream');
    /**
     * When the backend sends a new batch of documents+checkpoint,
     * emit it into the stream$.
     * 
     * event.data must look like this
     * {
     *     documents: [
     *        {
     *            id: 'foobar',
     *            _deleted: false,
     *            updatedAt: 1234
     *        }
     *     ],
     *     checkpoint: {
     *         id: 'foobar',
     *         updatedAt: 1234
     *     }
     * }
     */
    socket.onmessage = event => pullStream$.next(event.data);
    /**
     * Automatically reconnect the socket on close and error.
     */
    socket.onclose = () => connectSocket();
    socket.onerror = () => socket.close();

    socket.onopen = () => {
      if (firstOpen) {
        firstOpen = false;
      } else {
        /**
         * When the client is offline and goes online again,
         * it might have missed out events that happened on the server.
         * So we have to emit a RESYNC so that the replication goes
         * into 'Checkpoint iteration' mode until the client is in sync
         * and then it will go back into 'Event observation' mode again.
         */
        pullStream$.next('RESYNC');
      }
    }
  }

  const replicationState = await replicateRxCollection({
    collection: myRxCollection,
    /**
     * An id for the replication to identify it
     * and so that RxDB is able to resume the replication on app reload.
     * If you replicate with a remote server, it is recommended to put the
     * server url into the replicationIdentifier.
     */
    replicationIdentifier: 'my-rest-replication-to-https://example.com/api/sync',
    /**
     * By default it will do an ongoing realtime replication.
     * By settings live: false the replication will run once until the local state
     * is in sync with the remote state, then it will cancel itself.
     * (optional), default is true.
     */
    live: true,
    /**
     * Time in milliseconds after when a failed backend request
     * has to be retried.
     * This time will be skipped if a offline->online switch is detected
     * via navigator.onLine
     * (optional), default is 5 seconds.
     */
    retryTime: 5 * 1000,
    /**
     * When multiInstance is true, like when you use RxDB in multiple browser tabs,
     * the replication should always run in only one of the open browser tabs.
     * If waitForLeadership is true, it will wait until the current instance is leader.
     * If waitForLeadership is false, it will start replicating, even if it is not leader.
     * [default=true]
     */
    waitForLeadership: true,
    /**
     * If this is set to false,
     * the replication will not start automatically
     * but will wait for replicationState.start() being called.
     * (optional), default is true
     */
    autoStart: true,

    /**
     * Custom deleted field, the boolean property of the document data that
     * marks a document as being deleted.
     * If your backend uses a different fieldname then '_deleted', set the fieldname here.
     * RxDB will still store the documents internally with '_deleted', setting this field
     * only maps the data on the data layer.
     * 
     * If a custom deleted field contains a non-boolean value, the deleted state
     * of the documents depends on if the value is truthy or not. So instead of providing a boolean * * deleted value, you could also work with using a 'deletedAt' timestamp instead.
     * 
     * [default='_deleted']
     */
    deletedField: 'deleted',

    /**
     * Optional,
     * only needed when you want to replicate local changes to the remote instance.
     */
    push: {
      /**
       * Push handler
       */
      async handler(docs) {
        /**
         * Push the local documents to a remote REST server.
         */
        const rawResponse = await fetch('https://example.com/api/sync/push', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ docs })
        });
        /**
         * Contains an array with all conflicts that appeared during this push.
         * If there were no conflicts, return an empty array.
         */
        const response = await rawResponse.json();
        return response;
      },
      /**
       * Batch size, optional
       * Defines how many documents will be given to the push handler at once.
       */
      batchSize: 5,
      /**
       * Modifies all documents before they are given to the push handler.
       * Can be used to swap out a custom deleted flag instead of the '_deleted' field.
       * If the push modifier return null, the document will be skipped and not send to the remote.
       * Notice that the modifier can be called multiple times and should not contain any side effects.
       * (optional)
       */
      modifier: d => d
    },
    /**
     * Optional,
     * only needed when you want to replicate remote changes to the local state.
     */
    pull: {
      /**
       * Pull handler
       */
      async handler(lastCheckpoint, batchSize) {
        const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0;
        /**
         * In this example we replicate with a remote REST server
         */
        const response = await fetch(
          `https://example.com/api/sync/?minUpdatedAt=${minTimestamp}&limit=${batchSize}`
        );
        const documentsFromRemote = await response.json();
        return {
          /**
           * Contains the pulled documents from the remote.
           * Notice: If documentsFromRemote.length < batchSize,
           * then RxDB assumes that there are no more un-replicated documents
           * on the backend, so the replication will switch to 'Event observation' mode.
           */
          documents: documentsFromRemote,
          /**
           * The last checkpoint of the returned documents.
           * On the next call to the pull handler,
           * this checkpoint will be passed as 'lastCheckpoint'
           */
          checkpoint: documentsFromRemote.length === 0 ? lastCheckpoint : {
            id: lastOfArray(documentsFromRemote).id,
            updatedAt: lastOfArray(documentsFromRemote).updatedAt
          }
        };
      },
      batchSize: 10,
      /**
       * Modifies all documents after they have been pulled
       * but before they are used by RxDB.
       * Notice that the modifier can be called multiple times and should not contain any side effects.
       * (optional)
       */
      modifier: d => d,
      /**
       * Stream of the backend document writes.
       * See below.
       * You only need a stream$ when you have set live=true
       */
      stream$: pullStream$.asObservable()
    },
  });



}


