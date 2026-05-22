import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve(process.cwd(), "ios/App/App/PrivacyInfo.xcprivacy");

describe("iOS privacy manifest", () => {
  it("ships a privacy manifest for App Store review", () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it("declares no tracking for the native shell", () => {
    const manifest = readFileSync(manifestPath, "utf8");

    expect(manifest).toContain("NSPrivacyTracking");
    expect(manifest).toContain("<false/>");
  });

  it("is included in the Xcode app target resources", () => {
    const project = readFileSync(resolve(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj"), "utf8");

    expect(project).toContain("PrivacyInfo.xcprivacy in Resources");
  });
});
