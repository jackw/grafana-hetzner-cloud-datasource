package plugin

import (
	"context"

	"github.com/hetznercloud/hcloud-go/hcloud"
)

// GetAllServers retrieves all servers from the hezner cloud api
func GetAllServers(ctx context.Context, client *hcloud.Client) ([]*hcloud.Server, error) {
	servers, _, err := client.Server.List(ctx, hcloud.ServerListOpts{})

	if err != nil {
		return nil, err
	}

	return servers, nil
}
