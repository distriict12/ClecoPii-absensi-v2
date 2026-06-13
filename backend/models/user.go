package models

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PIN       string    `json:"pin" gorm:"type:varchar(255);unique;not null"`
	Role      string    `json:"role" gorm:"type:varchar(20);default:'employee'"`
	Employee  *Employee `json:"employee" gorm:"foreignKey:UserID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
