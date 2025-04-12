FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSLo /usr/local/bin/supercronic https://github.com/aptible/supercronic/releases/latest/download/supercronic-linux-amd64 && \
    chmod +x /usr/local/bin/supercronic

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY cronjob /app/cronjob

CMD ["/usr/local/bin/supercronic", "/app/cronjob"]
