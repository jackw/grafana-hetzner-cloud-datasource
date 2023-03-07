package plugin

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

func NewDataSourceInstance(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	datasourceSettings, err := LoadSettings(settings)
	if err != nil {
		return nil, err
	}
	var hetz = NewDatasource(context.Background(), datasourceSettings)

	return hetz, nil
}
