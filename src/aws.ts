import { S3 } from "aws-sdk";
import path from "path";
import fs from "fs";

const s3 = new S3({
  credentials: {
    accessKeyId: "c6f5297b909b7bc60c122605f1db3395",
    secretAccessKey:
      "75dba6dcea59702bada497ab3ff477a52814c509c0f40a577d7cbb8948b6fa17",
  },
  endpoint: "https://64e04d382b4e848cf00220d4577a091a.r2.cloudflarestorage.com",
});

export async function downloadS3Folder(prefix: string) {
  const allFiles = await s3
    .listObjectsV2({
      Bucket: "vercel-clone",
      Prefix: prefix,
    })
    .promise();

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }
        const finalOutputPath = path.join(__dirname, Key);
        const outputFile = fs.createWriteStream(finalOutputPath);
        const dirName = path.dirname(finalOutputPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        s3.getObject({
          Bucket: "vercel-clone",
          Key,
        })
          .createReadStream()
          .pipe(outputFile)
          .on("finish", () => {
            resolve("");
          });
      });
    }) || [];
  console.log("awaiting");
  await Promise.all(allPromises?.filter((x) => x !== undefined));
}

export function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    const uploadPath = file.slice(__dirname.length + 1).replace(/\\/g, "/");

    uploadFile(`dist/${id}/` + uploadPath, file);
  });
}

export const uploadFile = async (fileName: string, localFilePath: string) => {
  console.log("called");
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "vercel-clone",
      Key: fileName,
    })
    .promise();

  console.log(response);
};

export const getAllFiles = (folderath: string) => {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};
