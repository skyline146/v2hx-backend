import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { Observable, map } from "rxjs";

interface ClassConstructor {
  new (...args: any[]): object;
  // [key: string]: any;
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private SerializeDto: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //run something before request is handled
    // console.log('im running before request is handled', context);

    return next.handle().pipe(
      map((data: any) => {
        // run smth before response is sent out
        // console.log('im running before response is sent out', data);
        return plainToInstance(this.SerializeDto, data, {
          excludeExtraneousValues: true,
        });
      })
    );
  }
}
