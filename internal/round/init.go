package round

import (
	"context"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"log"
)

// Initial run will initialize round mapping in memory to prevent exceeding requests

func Init(d database.Database) {
	rounds, err := d.GetRounds(context.Background())
	if err != nil {
		log.Printf("DB Error: %v", err)
		return
	}

	RoundMap = []seater.RoundOption{}
	for _, r := range rounds {
		RoundMap = append(RoundMap, seater.RoundOption{
			ID:    r.ID,
			Label: r.Label,
		})
	}
	log.Printf("✅ Loaded %d exam rounds into memory", len(RoundMap))
}
