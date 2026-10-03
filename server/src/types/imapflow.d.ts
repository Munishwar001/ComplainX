declare module 'imapflow' {
  export interface ImapFlowOptions {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
    logger?: boolean | object;
    socketOptions?: { family?: number; [key: string]: any };
  }

  export interface MailboxStatus {
    messages?: number;
    unseen?: number;
    uidNext?: number;
  }

  export interface MailboxLock {
    release(): void;
  }

  export interface FetchedMessage {
    uid: number;
    source: Buffer;
    flags?: Set<string>;
  }

  export class ImapFlow {
    constructor(options: ImapFlowOptions);
    connect(): Promise<void>;
    logout(): Promise<void>;
    getMailboxLock(mailbox: string): Promise<MailboxLock>;
    search(query: Record<string, any>, options?: Record<string, any>): Promise<number[]>;
    fetch(
      range: number[] | string | string[],
      query: Record<string, any>,
      options?: Record<string, any>
    ): AsyncIterable<FetchedMessage>;
    status(mailbox: string, query: Record<string, boolean>): Promise<MailboxStatus>;
    messageFlagsAdd(
      range: string | number | number[],
      flags: string[],
      options?: Record<string, any>
    ): Promise<void>;
  }
}
