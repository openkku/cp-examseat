package database

import (
	"context"
	"cpkkuview/internal/base"
)

type RoundOption struct {
	ID    string
	Label string
}

type Database interface {
	GetSeatsByID(ctx context.Context, opts base.SeatsOptions) ([]Seats, error)
	GetSeats(ctx context.Context, opts base.ExploreOptions) ([]Seats, error)

	GetOptions(ctx context.Context, opts base.ModeOptions) ([]string, error)

	AddRound(ctx context.Context, roundID string, displayName string, seats []Seats) error
	PurgeRound(ctx context.Context, roundID string) error
	GetRounds(ctx context.Context) ([]RoundOption, error)
	GetAllSeats(ctx context.Context) ([]Seats, error)
}
