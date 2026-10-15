# Recovery notes

This repository was reconstructed from the public Vite preview for ContinuityOS. Original application source files were recovered through the preview's raw source endpoint. Manus-hosted runtime middleware, managed secrets, database credentials, generated `node_modules`, and platform debug routes were intentionally excluded.

The client is configured as a standard Vite app under `client/`. The original product UI and local/demo analysis logic are included; platform-only login/API behavior may require re-connecting those services in a target deployment.
