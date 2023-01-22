/**
 * CORS Anywhere is needed for downloading from GitHub. Visit https://cors-anywhere.herokuapp.com for details
 */
const corsAnywhere = "https://cors-anywhere.herokuapp.com/";

/**
 *
 * @param repo GitHub repository to get oauth token for
 * @param githubToken your GitHub PAT used to get the oauth token
 * @returns oauth token for given repository
 */
async function oauth(repo: string, githubToken: string) {
  if (githubToken == null || !githubToken.startsWith("gh")) {
    return "QQ==";
  }

  console.log("Token: \t" + repo);

  const tokenResponse = await fetch(
    corsAnywhere +
      `https://ghcr.io/token?service=ghcr.io&scope=repository:${repo}:pull&client_id=npm-js-oras-pull`,
    {
      headers: {
        authorization: "Basic " + btoa("foo:" + githubToken),
      },
    }
  );
  if (tokenResponse.status !== 200) {
    console.dir(await tokenResponse.json());
    throw new Error(
      `HTTP ${
        tokenResponse.status
      } Could not get oauth token for ${repo}: ${await tokenResponse.text()}`
    );
  }
  return (await tokenResponse.json()).token;
}

async function run(imageName: string, githubToken: string) {
  if (imageName === undefined) {
    throw new Error("Supply image name");
  }

  console.log("Pull: \t" + imageName);

  let [url, tag] = imageName.split(":");

  const repo = url.replace("ghcr.io/", "").split("/").splice(0, 2).join("/");
  const bearer = await oauth(repo, githubToken);

  url = url.replace("ghcr.io", "https://ghcr.io/v2");

  const manifestResponse = await fetch(
    corsAnywhere + url + "/manifests/" + tag,
    {
      headers: {
        accept: "application/vnd.oci.image.manifest.v1+json",
        authorization: "Bearer " + bearer,
      },
    }
  );
  if (manifestResponse.status !== 200) {
    console.dir(await manifestResponse.json());
    throw new Error(
      `HTTP ${
        manifestResponse.status
      } Could not get manifest for ${imageName}: ${await manifestResponse.text()}`
    );
  }

  const manifest = await manifestResponse.json();
  const layer = manifest.layers[0];
  console.log("Digest: " + layer.digest);
  console.log("Size: \t" + layer.size + " bytes");

  const fetchBlob = async () => {
    const blobResponse = await fetch(
      corsAnywhere + url + "/blobs/" + layer.digest,
      {
        headers: {
          authorization: "Bearer " + bearer,
        },
      }
    );
    if (blobResponse.status !== 200) {
      console.dir(await manifestResponse.json());
      throw new Error(
        `HTTP ${
          blobResponse.status
        } Could not get oauth token for ${imageName}: ${await blobResponse.text()}`
      );
    }

    return blobResponse;
  };

  // Credit https://stackoverflow.com/a/74411631/5550386

  const fetchStreamToDecompressionStream = (response: Response) =>
    // @ts-ignore
    response.body.pipeThrough(new DecompressionStream("gzip"));

  const decompressionStreamToBlob = (decompressedStream: ReadableStream) =>
    new Response(decompressedStream).blob();

  const blobToDir = async (blob: Blob) => {
    // @ts-ignore currently included in index.html
    const tar = new tarball.TarReader();
    const fileInfo = await tar.readFile(blob);
    console.log("Extracted files:");
    console.log(fileInfo);
    return tar;
  };

  fetchBlob()
    .then(fetchStreamToDecompressionStream)
    .then(decompressionStreamToBlob)
    .then(blobToDir)
    .then((tar) => console.log(tar.getTextFile("src/hello.txt")));
}

// TODO: make imageName an input variable
run("ghcr.io/larshp/oras-test/oras-test:latest", "YOUR_PAT")
  .then(() => {
    // noop
  })
  .catch((err) => {
    console.log(err);
  });
