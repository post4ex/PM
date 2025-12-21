{ pkgs, ... }: {
  # Keep the channel updated
  channel = "stable-24.05";

  # Install Python automatically
  packages = [
    pkgs.python311
  ];

  # Configure the interface
  idx = {
    # Useful extensions for web dev
    extensions = [
      "ritwickdey.liveserver" # This installs the actual Live Server extension!
    ];

    # Setup the Preview Panel
    previews = {
      enable = true;
      previews = {
        web = {
          # This command starts the server on the correct port for IDX
          command = ["python3" "-m" "http.server" "$PORT" "--bind" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}