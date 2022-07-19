// import defaults from 'lodash/defaults';
import { Observable, of } from 'rxjs';
import {
  DataQueryRequest,
  DataQueryResponse,
  // DataQueryRequest,
  // DataSourceApi,
  DataSourceInstanceSettings,
  getDataSourceRef,
  // MutableDataFrame,
  // FieldType,
} from '@grafana/data';

import { BackendDataSourceResponse, DataSourceWithBackend, getBackendSrv, getDataSourceSrv } from '@grafana/runtime';

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
  /**
   * Ideally final -- any other implementation may not work as expected
   */
  // query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> {
  //   const { intervalMs, maxDataPoints, range, requestId } = request;
  //   let targets = request.targets;

  //   if (this.filterQuery) {
  //     targets = targets.filter((q) => this.filterQuery!(q));
  //   }

  //   const queries = targets.map((q) => {
  //     let datasource = this.getRef();
  //     let datasourceId = this.id;

  //     if (isExpressionReference(q.datasource)) {
  //       return {
  //         ...q,
  //         datasource: ExpressionDatasourceRef,
  //       };
  //     }

  //     if (q.datasource) {
  //       const ds = getDataSourceSrv().getInstanceSettings(q.datasource, request.scopedVars);

  //       if (!ds) {
  //         throw new Error(`Unknown Datasource: ${JSON.stringify(q.datasource)}`);
  //       }

  //       datasource = ds.rawRef ?? getDataSourceRef(ds);
  //       datasourceId = ds.id;
  //     }

  // return {
  //   ...this.applyTemplateVariables(q, request.scopedVars),
  //   datasource,
  //   datasourceId, // deprecated!
  //   intervalMs,
  //   maxDataPoints,
  // };
  //   });

  //   // Return early if no queries exist
  //   if (!queries.length) {
  //     return of({ data: [] });
  //   }

  //   const body: any = { queries };

  //   if (range) {
  //     body.range = range;
  //     body.from = range.from.valueOf().toString();
  //     body.to = range.to.valueOf().toString();
  //   }

  //   if (config.featureToggles.queryOverLive) {
  //     return getGrafanaLiveSrv().getQueryData({
  //       request,
  //       body,
  //     });
  //   }

  //   return getBackendSrv()
  //     .fetch<BackendDataSourceResponse>({
  //       url: '/api/ds/query',
  //       method: 'POST',
  //       data: body,
  //       requestId,
  //     })
  //     .pipe(
  //       switchMap((raw) => {
  //         const rsp = toDataQueryResponse(raw, queries as DataQuery[]);
  //         // Check if any response should subscribe to a live stream
  //         if (rsp.data?.length && rsp.data.find((f: DataFrame) => f.meta?.channel)) {
  //           return toStreamingDataResponse(rsp, request, this.streamOptionsProvider);
  //         }
  //         return of(rsp);
  //       }),
  //       catchError((err) => {
  //         return of(toDataQueryResponse(err));
  //       })
  //     );
  // }

  // async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
  //   const { range } = options;
  //   const from = range!.from.valueOf();
  //   const to = range!.to.valueOf();

  //   // Return a constant for each query.
  //   const data = options.targets.map((target) => {
  //     const query = defaults(target, defaultQuery);
  //     return new MutableDataFrame({
  //       refId: query.refId,
  //       fields: [
  //         { name: 'Time', values: [from, to], type: FieldType.time },
  //         { name: 'Value', values: [query.constant, query.constant], type: FieldType.number },
  //       ],
  //     });
  //   });

  //   return { data };
  // }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
