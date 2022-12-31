{
  description = "FRC Team 1619 Robot Simulator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachSystem [flake-utils.lib.system.x86_64-linux] (
      system: let
        pkgs = import nixpkgs {
          inherit system;
        };

        nodejs = pkgs.nodejs-19_x;
      in {
        packages = {
        };

        devShells = {
          default = pkgs.mkShell {
            buildInputs = [
              nodejs
            ];
            inputsFrom = builtins.attrValues self.packages.${system};
          };
        };

        formatter = pkgs.alejandra;
      }
    );
}
