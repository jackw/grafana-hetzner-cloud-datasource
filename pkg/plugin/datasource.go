package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/hetznercloud/hcloud-go/hcloud"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces- only those which are required for a particular task.
var (
	_ backend.QueryDataHandler   = (*Datasource)(nil)
	_ backend.CheckHealthHandler = (*Datasource)(nil)
)

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	client *hcloud.Client
}

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, settings Settings) *Datasource {
	log.DefaultLogger.Info("NewDatasource called", "settings", settings.APIToken)
	hetzClient := hcloud.NewClient(hcloud.WithToken(settings.APIToken))

	backend.Logger.Info("NewDatasource", "client", hetzClient)

	return &Datasource{
		client: hetzClient,
	}
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// TODO: check this is how to clean up datasource instance resources...
	d.client = nil
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	log.DefaultLogger.Info("QueryData called", "request", req)

	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct{}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	response := backend.DataResponse{}

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	response.Error = json.Unmarshal(query.JSON, &qm)
	if response.Error != nil {
		return response
	}

	// create data frame response.
	frame := data.NewFrame("response")

	// add fields.
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
		data.NewField("values", nil, []int64{10, 20}),
	)

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {

	servers, err := GetAllServers(ctx, d.client)

	if err != nil {
		return newHealthCheckErrorf("Failed to get servers, please check your API token is correct."), nil
	}

	if len(servers) > 0 {
		log.DefaultLogger.Info("CheckHealth called", "server", servers[0])
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusOk,
			Message: fmt.Sprintf("Successfully queried the Hetzner Cloud API and found server named `%s`", servers[0].Name),
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Successfully queried the Hetzner Cloud API.",
	}, nil
}

// newHealthCheckErrorf returns a new *backend.CheckHealthResult with its status set to backend.HealthStatusError
// and the specified message, which is formatted with Sprintf.
func newHealthCheckErrorf(format string, args ...interface{}) *backend.CheckHealthResult {
	return &backend.CheckHealthResult{Status: backend.HealthStatusError, Message: fmt.Sprintf(format, args...)}
}
