.PHONY: install run test lint clean

install:
	pip install -r requirements.txt

run:
	python main.py

test:
	pytest tests/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	rm -rf .pytest_cache
