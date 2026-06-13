package models

import "time"

type Outlet struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Name      string `json:"name" gorm:"type:varchar(100);not null"`
	Address   string `json:"addr" gorm:"type:text"`
	Latitude  string `json:"lat" gorm:"type:varchar(50);not null"`
	Longitude string `json:"lng" gorm:"type:varchar(50);not null"`
	Radius    int    `json:"rad" gorm:"default:15"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
