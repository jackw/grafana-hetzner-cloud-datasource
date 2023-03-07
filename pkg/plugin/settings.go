package plugin

import (
	"encoding/json"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// Settings represents the Datasource ConfigEditor options
type Settings struct {
	APIToken string `json:"apiToken"`
}

func LoadSettings(settings backend.DataSourceInstanceSettings) (Settings, error) {
	s := Settings{}
	if err := json.Unmarshal(settings.JSONData, &s); err != nil {
		return Settings{}, err
	}

	if apiToken, exists := settings.DecryptedSecureJSONData["apiToken"]; exists {
		s.APIToken = apiToken
	}

	return s, nil
}
