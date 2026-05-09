FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Keep native numerical dependencies inside the image. The service port is only
# documented here; docker-compose intentionally does not publish it to the host.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY backend ./backend

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /var/lib/arppl/records \
    && chown -R appuser:appuser /app /var/lib/arppl \
    && chmod 775 /var/lib/arppl/records
USER appuser

ENV ARPPL_RECORD_ROOT=/var/lib/arppl/records
EXPOSE 8000
CMD ["uvicorn", "backend.arppy:app", "--host", "0.0.0.0", "--port", "8000"]
