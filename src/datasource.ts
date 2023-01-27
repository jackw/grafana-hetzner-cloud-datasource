import { Observable, of } from 'rxjs';
import { DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, getDataSourceRef } from '@grafana/data';

import {
  BackendDataSourceResponse,
  DataSourceWithBackend,
  getBackendSrv,
  getDataSourceSrv,
  HealthCheckError,
  HealthStatus,
} from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  query(request: DataQueryRequest): Observable<DataQueryResponse> {
    const { requestId, intervalMs, maxDataPoints } = request;
    const targets = request.targets;

    // targets === a datasource query
    // targets.refId === a single datasource query name (editable in query editor UI)

    const queries = targets.map((q) => {
      let datasource = this.getRef();

      if (q.datasource) {
        const ds = getDataSourceSrv().getInstanceSettings(q.datasource, request.scopedVars);

        if (!ds) {
          throw new Error(`Unknown Datasource: ${JSON.stringify(q.datasource)}`);
        }

        datasource = ds.rawRef ?? getDataSourceRef(ds);
      }

      return {
        ...q,
        datasource,
        intervalMs,
        maxDataPoints,
      };
    });

    console.log(queries);

    // CONVOLUTED! 💩
    const body = { queries };

    const res = getBackendSrv()
      .fetch<BackendDataSourceResponse>({
        url: '/api/ds/query',
        method: 'POST',
        data: body,
        requestId,
      })
      .toPromise()
      .then((res) => {
        console.log('THEN', res);
      })
      .catch((err) => {
        console.log('ERR', err);
      });

    console.log(res);
    // .pipe(
    //   switchMap((raw) => {
    //     const rsp = toDataQueryResponse(raw, queries as DataQuery[]);
    //     // Check if any response should subscribe to a live stream
    //     if (rsp.data?.length && rsp.data.find((f: DataFrame) => f.meta?.channel)) {
    //       return toStreamingDataResponse(rsp, request, this.streamOptionsProvider);
    //     }
    //     return of(rsp);
    //   }),
    //   catchError((err) => {
    //     return of(toDataQueryResponse(err));
    //   })
    // );

    return of({ data: [] });
  }

  async testDatasource(): Promise<any> {
    return this.callHealthCheck().then((res) => {
      if (res.status === HealthStatus.OK) {
        return {
          status: 'success',
          message: res.message,
        };
      }

      throw new HealthCheckError(res.message, res.details);
    });
  }
}
