<script setup lang="ts">
import { ref } from 'vue';
import Downloader from '../Downloader.ts';
import Utils from '../Utils.ts';

const tracks = ref(new Array<{
  fileName: string,
  size: string,
  version: string,
  date: string,
  url: string,
  startNewVersionGroup: boolean,
}>());

loadTracks();

async function loadTracks() {
  const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });

  for await (const assetsByVersion of iterateMusicAssetsByVersion()) {
    let startNewVersionGroup = true;

    const newItems = new Array<{
      fileName: string,
      size: string,
      version: string,
      date: string,
      url: string,
      startNewVersionGroup: boolean,
    }>();

    for (const asset of assetsByVersion.assets) {
      newItems.push({
        fileName: asset.fileName,
        size: Utils.formatBytes(asset.size),
        version: assetsByVersion.firstVersion.id,
        date: dateFormat.format(new Date(assetsByVersion.firstVersion.releaseTime)),
        url: asset.url,
        startNewVersionGroup,
      });

      startNewVersionGroup = false;
    }

    tracks.value = newItems.concat(tracks.value);
  }
}

async function* iterateMusicAssetsByVersion() {
  const fileNamesByHash = new Map<string, string>();

  for await (const assetIndex of Downloader.fetchAssetIndexUrls()) {
    const { objects } = await Downloader.fetchAssetIndex(assetIndex.url);

    // Due to CORS on resources.download.minecraft.net, can't read sounds.json from a webpage running in a web server.
    // It's not present for 1.0 anyway.

    const assets = new Array<{ fileName: string, size: number, url: string }>();

    for (const assetName in objects) {
      // Catches 'newmusic' folder also
      if (assetName.match(/(records|music)\//i)) {
        const fileName = assetName.slice(assetName.lastIndexOf('/') + 1);
        const asset = objects[assetName];

        const previousFileName = fileNamesByHash.get(asset.hash);
        if (previousFileName === undefined) {
          fileNamesByHash.set(asset.hash, fileName);
          assets.push({
            fileName,
            size: asset.size,
            url: Downloader.buildAssetUrl(asset.hash),
          });
        } else if (previousFileName !== fileName) {
          console.warn(`Asset name differs for same hash: ${previousFileName} vs ${fileName}`);
        }
      }
    }

    assets.sort((a, b) => a.fileName.localeCompare(b.fileName));

    yield { firstVersion: assetIndex.firstVersion, assets };
  }
}
</script>

<template>
  <table>
    <thead>
      <tr>
        <th scope="col">Version</th>
        <th scope="col">Released</th>
        <th scope="col">Filename</th>
        <th scope="col">Right-click player to save audio file<abbr title="ℹ️ If filenames appear random, this is a limitation of certain browsers such as Firefox. Try switching browsers.">*</abbr></th>
        <th scope="col">Download size</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="track in tracks" :key="track.url" :class="{ 'new-version': track.startNewVersionGroup }">
        <td>{{ track.version }}</td>
        <td>{{ track.date }}</td>
        <td>{{ track.fileName }}</td>
        <td>
          <!-- Due to CORS, download links will always navigate instead of downloading. -->
          <!-- The title controls the right-click "Save As" filename in some browsers. -->
          <audio :src="track.url" controls :title="track.fileName"></audio>
        </td>
        <td>{{ track.size }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
  table {
    border-spacing: 15px 0;
  }

  tr.new-version > td {
    padding-top: 40px;
  }
</style>
