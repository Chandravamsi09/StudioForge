.PHONY: install build test dev clean docker-build docker-up

install:
	npm install
	cd backend && npm install
	cd frontend && npm install

build:
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd backend && npm test
	cd backend && npm run test:e2e

dev:
	npm start

docker-build:
	docker build -t studioforge:latest .

docker-up:
	docker compose up -d

clean:
	rm -rf backend/dist frontend/dist backend/node_modules frontend/node_modules
