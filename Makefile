default:
	@make docs
	@make compile

compile: clean
	babel -d lib src

clean:
	rm -rf lib/*

test-watch:
	mocha --watch --growl --require babel-register --require test/setup.js test/**/*.spec.js

lint:
	eslint src --ignore-pattern .gitignore

docs: lint test
	mkdir -p dist/docs
	esdoc -c ./esdoc.json

test:
	mocha --require babel-register --require test/setup.js test/**/*.spec.js

.PHONY: test
