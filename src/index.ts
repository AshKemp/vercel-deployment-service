import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";

const subscriber = createClient();
subscriber.connect();
const publisher = createClient();
subscriber.connect();

async function main() {
  while (1) {
    const res = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );
    // @ts-ignore
    const id = res.element;

    await downloadS3Folder(`output/${id}`);
    console.log("downloaded");
    await buildProject(id);
    copyFinalDist(id);
    await publisher.hSet("status", id, "deployed");
  }
}

main();
