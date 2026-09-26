/**
 * Get user's computer platform
 *
 * @param  {string}                            platform  Node's process.platform
 * @return {"osx"| "win" | "linux" | "string"}           Platform types
 */
export function getPlatform(platform){
  switch (platform) {
    case "darwin":
      return "osx";
    case "win32":
      return "win";
    case "linux":
      return "linux";
    default:
      throw new Error("Your OS is not supported by NW JS");
  }
};

/**
 * Get user's computer architecture
 *
 * @param  {string}                            platform  Node's process.platform
 * @return {"osx"| "win" | "linux" | "string"}           Platform types
 */
export function getArchitecture(architecture){
  switch (architecture) {
    case "ia32":
    case "x64":
    case "arm64":
      return architecture;
    default:
      throw new Error("Your architecture is not supported by NW JS");
  }
};