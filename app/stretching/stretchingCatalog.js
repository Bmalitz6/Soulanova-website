'use strict';
(function(root){const catalog={
  "movements": [
    {
      "id": "overhead-reset",
      "name": "Shoulder Stretch",
      "category": "Upper body",
      "file": "IMG_4096.mov",
      "seconds": 28.433,
      "instruction": "Follow the demonstrated shoulder stretch within a comfortable range.",
      "status": "identified",
      "sha256": "de62b10902b60eea026ad970c9577c6c9a8b77a38a00fec74c5da63f06f14042",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "overhead-shoulder",
      "name": "Overhead shoulder stretch",
      "category": "Upper body",
      "file": "IMG_4097.mov",
      "seconds": 29.067,
      "instruction": "Reach one arm overhead and gently bend the elbow; use the other hand to guide the stretch.",
      "status": "identified",
      "sha256": "8ea07fdbc8de8f1c30e8c3ca645c00e2903b061753f09c7816c91345800297d6",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "overhead-reach",
      "name": "Overhead reach",
      "category": "Upper body",
      "file": "IMG_4098.mov",
      "seconds": 29,
      "instruction": "Reach both arms overhead and lengthen through the sides of the body.",
      "status": "identified",
      "sha256": "e5508186a3bed9c7e3868af88800db7bb5673a8cb8b5eb6a559d7d25d50e28a1",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "forward-fold",
      "name": "Standing forward fold",
      "category": "Lower body",
      "file": "IMG_4099.mp4",
      "seconds": 35.042,
      "instruction": "Hinge gently at the hips and fold forward within a comfortable range.",
      "status": "identified",
      "sha256": "420766c54d90a97b78e1e624415d0f415d9ba3e0ac89253eb811129bf83d8e71",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hamstring-a",
      "name": "Standing hamstring stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4100.mp4",
      "seconds": 29,
      "instruction": "Extend one leg forward with the heel down and hinge gently at the hips.",
      "status": "identified",
      "sha256": "51ac818a7a6e6c13a40a67187f319cd5dfca688f13e15637becbebaca81b553f",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-flexor-a",
      "name": "Staggered-stance hip-flexor stretch, variation A",
      "category": "Hips",
      "file": "IMG_4102.mp4",
      "seconds": 29,
      "instruction": "Use a staggered lunge stance and gently shift the hips forward while staying tall.",
      "status": "identified",
      "sha256": "5dae18420038711226d0867eed9639b555d3a7e20ee4c6b455934ec1e2652359",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-flexor-b",
      "name": "Staggered-stance hip-flexor stretch, variation B",
      "category": "Hips",
      "file": "IMG_4103.mp4",
      "seconds": 29,
      "instruction": "Use a staggered lunge stance and gently shift the hips forward while staying tall.",
      "status": "identified",
      "sha256": "e90cb34e31a28cb810011d02b5db0656385beef4a5dcbe5c2df76f3918cf6370",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "figure-four-a",
      "name": "Standing figure-four stretch, variation A",
      "category": "Hips",
      "file": "IMG_4104.mov",
      "seconds": 27.733,
      "instruction": "Balance comfortably, cross one ankle over the opposite thigh, and sit back slightly.",
      "status": "identified",
      "sha256": "3df3b1e8579b8696a77dcf8a17867ee033ae3197465fc21fafd534fe2a1a6f16",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "figure-four-b",
      "name": "Standing figure-four stretch, variation B",
      "category": "Hips",
      "file": "IMG_4105.mov",
      "seconds": 26.333,
      "instruction": "Balance comfortably, cross one ankle over the opposite thigh, and sit back slightly.",
      "status": "identified",
      "sha256": "55c6cd81b240cfbe192823ffd8b9bcd404e207fb1a72ac5174ddec675dbb87f6",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "adductor",
      "name": "Lateral lunge / adductor stretch",
      "category": "Lower body",
      "file": "IMG_4106.mp4",
      "seconds": 29,
      "instruction": "Shift your hips toward one bent leg while the other leg stays long and comfortable.",
      "status": "identified",
      "sha256": "f979dd234a23dbc3a985dbf3a4ace006a3175f9288e3443306784ea41e7fa7e5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "shoulder-a",
      "name": "Cross-body shoulder stretch, variation A",
      "category": "Upper body",
      "file": "IMG_4107.mp4",
      "seconds": 29,
      "instruction": "Bring one arm across the chest and support it gently with the opposite arm.",
      "status": "identified",
      "sha256": "59ca2a8c7e6c396b7efcde94689f05a037f673578943b8d1a4a9d5486f80a2f5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "shoulder-b",
      "name": "Cross-body shoulder stretch, variation B",
      "category": "Upper body",
      "file": "IMG_4108.mov",
      "seconds": 29,
      "instruction": "Bring one arm across the chest and support it gently with the opposite arm.",
      "status": "identified",
      "sha256": "0f5cc134cc36bf77138cb30b0eb33b5503e259c73d3b239e91aa1e9da50c51d9",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "calf-a",
      "name": "Standing calf stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4111.mp4",
      "seconds": 29,
      "instruction": "Place one foot behind you and press the heel toward the floor as you lean gently forward.",
      "status": "identified",
      "sha256": "4d688dcacb9e280c8e1a0d87f78af431d5bcf6bc3ad60fe52c6029d38a0b37ee",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "calf-b",
      "name": "Standing calf stretch, variation B",
      "category": "Lower body",
      "file": "IMG_4112.mp4",
      "seconds": 29,
      "instruction": "Place one foot behind you and press the heel toward the floor as you lean gently forward.",
      "status": "identified",
      "sha256": "a664c098552bcbd2096dac8fccb260efce683fdc6f7aa78d6b2a3b38100d1dfe",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4113",
      "name": "Calf Raises",
      "category": "Lower body",
      "file": "IMG_4113.mov",
      "seconds": 29.433,
      "instruction": "Follow the demonstrated calf raises at a comfortable pace.",
      "status": "identified",
      "sha256": "f1d36d4d25ea76baeb86a5f222f653646a1db6084be7ee1a4d2bed03ddf506b5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4114",
      "name": "Toe Raises",
      "category": "Lower body",
      "file": "IMG_4114.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated toe raises at a comfortable pace.",
      "status": "identified",
      "sha256": "2d837888dc6ba43aa822643b7f281b10156a6eb4bb5a9f87085d77ea9111a58f",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "side-bend",
      "name": "Hip Rotations",
      "category": "Hips",
      "file": "IMG_4115.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated hip rotations within a comfortable range.",
      "status": "identified",
      "sha256": "6d2fbd5c7f6a6960b20a3ef85aac972752c6a094e50f1bfa0ba3d84d139c9776",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-abduction",
      "name": "Hip Flexor",
      "category": "Hips",
      "file": "IMG_4117.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated hip-flexor movement within a comfortable range.",
      "status": "identified",
      "sha256": "cb5c70acac6366203e147eefcdcf13f0bb872fdfece10ccf2f70b84456a84731",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "knee-chest",
      "name": "Standing knee-to-chest stretch",
      "category": "Hips",
      "file": "IMG_4120.mp4",
      "seconds": 29,
      "instruction": "Stand tall with support nearby and gently draw one knee toward the chest.",
      "status": "identified",
      "sha256": "28779359e4eb6bf504bfafc3af85a489007c152bae3f2abc25b51b3f7185823c",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "wide-stance-a",
      "name": "Wide-stance lateral stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4121.mp4",
      "seconds": 29,
      "instruction": "Take a wide stance, bend one knee comfortably, and reach the arms outward.",
      "status": "identified",
      "sha256": "2e6df3e0084b9601dc4eb5df9383b22f8115c7e0cd0e314ec81fd727b8cdbc37",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "wide-stance-b",
      "name": "Wide-stance lateral stretch, variation B",
      "category": "Lower body",
      "file": "IMG_4122.mp4",
      "seconds": 29,
      "instruction": "Take a wide stance, bend one knee comfortably, and reach the arms outward.",
      "status": "identified",
      "sha256": "2e5bc8cca60f4abc654a4bc0f27f82526f160d2ea5615156df297a890ba2fc89",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4123",
      "name": "Chest Stretch",
      "category": "Upper body",
      "file": "IMG_4123.mp4",
      "seconds": 28.708,
      "instruction": "Follow the demonstrated chest stretch within a comfortable range.",
      "status": "identified",
      "sha256": "29f542953962d8c172db79173394cf426f2fa811132e5eda05e2893b0ec72a48",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    }
  ],
  "routines": [
    {
      "id": "full-body-gentle",
      "title": "Gentle Full-Body Reset",
      "category": "Full body",
      "minutes": 5,
      "description": "A calm sequence for upper body, hips, and legs.",
      "ids": [
        "overhead-reach",
        "overhead-reset",
        "shoulder-a",
        "hip-flexor-a",
        "hamstring-a",
        "calf-a",
        "standing-reset-4113",
        "standing-reset-4114",
        "standing-reset-4123"
      ]
    },
    {
      "id": "upper-body",
      "title": "Upper-Body Ease",
      "category": "Upper body",
      "minutes": 3,
      "description": "Easy shoulder, chest, and overhead mobility.",
      "ids": [
        "overhead-shoulder",
        "overhead-reach",
        "shoulder-a",
        "overhead-reset",
        "standing-reset-4123"
      ]
    },
    {
      "id": "hips-and-legs",
      "title": "Hips & Legs",
      "category": "Lower body",
      "minutes": 4,
      "description": "A gentle lower-body sequence with balance options.",
      "ids": [
        "hip-flexor-a",
        "figure-four-a",
        "adductor",
        "knee-chest",
        "calf-a",
        "side-bend",
        "hip-abduction"
      ]
    }
  ]
};
catalog.mediaUrl=function(file,sha256,publicBase){
  const approved=catalog.movements.find(m=>m.file===file&&m.sha256===sha256);
  if(!approved)throw new Error('Refusing unapproved SoulStretch media mapping');
  const local='/app/stretching/media/'+encodeURIComponent(file);
  if(typeof publicBase!=='string'||!publicBase.trim())return local;
  const base=new URL(publicBase.trim());
  if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('SoulStretch media base must be a clean HTTPS URL');
  if(!base.pathname.endsWith('/'))base.pathname+='/';
  return new URL(encodeURIComponent(sha256)+'/'+encodeURIComponent(file),base).href;
};
if(typeof module==='object'&&module.exports)module.exports=catalog;
if(root)root.SoulStretchCatalog=catalog;
})(typeof globalThis==='undefined'?this:globalThis);
