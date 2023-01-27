package hetzner

import (
	"github.com/hetznercloud/hcloud-go/hcloud"
)

var NewHetznerAPI = func(token string) (*hcloud.Client, error) {
	client := hcloud.NewClient(hcloud.WithToken(token))
	return client, nil
}
