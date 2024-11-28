export class HttpException extends Error {
    public status: number;
  
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  