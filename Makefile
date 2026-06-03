.PHONY: build run test clean web-build web-dev bleve-knn-experiment

BINARY := rag-eval
DB_PATH ?= data/rag-eval.db
ADDRESS ?= 127.0.0.1:8772
FAISS_LIB_DIR ?= /usr/local/lib

build:
	go build -o $(BINARY) ./cmd/rag-eval

run: build
	RAG_EVAL_DB=$(DB_PATH) RAG_EVAL_ADDRESS=$(ADDRESS) ./$(BINARY)

test:
	go test ./... -count=1

bleve-knn-experiment:
	GOWORK=off CGO_LDFLAGS="-L$(FAISS_LIB_DIR) -lfaiss_c -lfaiss -lstdc++ -lm" \
		go run -tags=vectors -ldflags "-r $(FAISS_LIB_DIR)" ./cmd/experiments/bleve-knn/

clean:
	rm -f $(BINARY)
	rm -rf data/

web-install:
	cd web && pnpm install

web-dev:
	cd web && pnpm dev

web-build:
	cd web && pnpm build


# Build Go binary with embedded SPA
build-full: web-build
	go build -o $(BINARY) ./cmd/rag-eval

lint:
	golangci-lint run -v
