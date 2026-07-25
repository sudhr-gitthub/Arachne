import uvicorn

if __name__ == "__main__":
    # Start the modular app located in the app directory
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
