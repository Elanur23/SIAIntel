#!/usr/bin/env python3
"""
Development server with auto-reload
Watches for file changes and restarts the server automatically
"""

import sys
import time
import subprocess
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

class ChangeHandler(FileSystemEventHandler):
    def __init__(self, restart_callback):
        self.restart_callback = restart_callback
        self.last_restart = 0
        
    def on_modified(self, event):
        # Ignore directory changes and non-Python files
        if event.is_directory:
            return
        
        if not event.src_path.endswith('.py'):
            return
        
        # Debounce: wait 1 second between restarts
        current_time = time.time()
        if current_time - self.last_restart < 1:
            return
        
        self.last_restart = current_time
        logger.info(f"🔄 File changed: {event.src_path}")
        self.restart_callback()

class DevServer:
    def __init__(self):
        self.process = None
        self.observer = None
        
    def start_server(self):
        """Start the FastAPI server"""
        if self.process:
            logger.info("⏹️  Stopping server...")
            self.process.terminate()
            self.process.wait()
        
        logger.info("🚀 Starting server...")
        self.process = subprocess.Popen(
            [sys.executable, "main.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Print server output in real-time
        def print_output():
            for line in self.process.stdout:
                print(line, end='')
        
        import threading
        threading.Thread(target=print_output, daemon=True).start()
    
    def start_watching(self):
        """Start watching for file changes"""
        event_handler = ChangeHandler(self.start_server)
        self.observer = Observer()
        
        # Watch current directory and core directory
        self.observer.schedule(event_handler, ".", recursive=False)
        self.observer.schedule(event_handler, "core", recursive=True)
        
        self.observer.start()
        logger.info("👀 Watching for file changes...")
        logger.info("📁 Watching: . and core/")
        logger.info("Press Ctrl+C to stop")
        
    def run(self):
        """Run the development server with auto-reload"""
        try:
            self.start_server()
            self.start_watching()
            
            # Keep the script running
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("\n⏹️  Shutting down...")
            if self.observer:
                self.observer.stop()
                self.observer.join()
            if self.process:
                self.process.terminate()
                self.process.wait()
            logger.info("✅ Server stopped")

if __name__ == "__main__":
    logger.info("="*60)
    logger.info("🏭 SIAIntel - Development Server with Auto-Reload")
    logger.info("="*60)
    
    server = DevServer()
    server.run()
