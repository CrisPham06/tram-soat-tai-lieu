# Kết quả đo

```json
{
  "command": "npm run evaluate",
  "at": "2026-11-02T02:26:42.407Z",
  "code_revision": "eecf96adb098c0e463419182eaad4ff0204f7f04",
  "node": "v24.14.0",
  "os": "Windows_NT 10.0.26300 x64",
  "files": 44,
  "usableFiles": 40,
  "errorFiles": 4,
  "rules": 17,
  "perRule": {
    "MARK-01": {
      "tp": 5,
      "fp": 0,
      "fn": 0,
      "tn": 35,
      "precision": 1,
      "recall": 1
    },
    "MARK-02": {
      "tp": 0,
      "fp": 0,
      "fn": 0,
      "tn": 40,
      "precision": null,
      "recall": null
    },
    "MARK-03": {
      "tp": 2,
      "fp": 0,
      "fn": 0,
      "tn": 38,
      "precision": 1,
      "recall": 1
    },
    "KEYW-01": {
      "tp": 5,
      "fp": 0,
      "fn": 0,
      "tn": 35,
      "precision": 1,
      "recall": 1
    },
    "PII-01": {
      "tp": 4,
      "fp": 0,
      "fn": 1,
      "tn": 35,
      "precision": 1,
      "recall": 0.8
    },
    "PII-02": {
      "tp": 3,
      "fp": 0,
      "fn": 0,
      "tn": 37,
      "precision": 1,
      "recall": 1
    },
    "PII-03": {
      "tp": 2,
      "fp": 0,
      "fn": 0,
      "tn": 38,
      "precision": 1,
      "recall": 1
    },
    "NET-01": {
      "tp": 2,
      "fp": 0,
      "fn": 1,
      "tn": 37,
      "precision": 1,
      "recall": 0.6666666666666666
    },
    "NET-02": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "NET-03": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "META-01": {
      "tp": 2,
      "fp": 0,
      "fn": 1,
      "tn": 37,
      "precision": 1,
      "recall": 0.6666666666666666
    },
    "META-02": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "META-03": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "META-04": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "META-05": {
      "tp": 1,
      "fp": 0,
      "fn": 0,
      "tn": 39,
      "precision": 1,
      "recall": 1
    },
    "META-06": {
      "tp": 2,
      "fp": 0,
      "fn": 1,
      "tn": 37,
      "precision": 1,
      "recall": 0.6666666666666666
    },
    "META-07": {
      "tp": 0,
      "fp": 0,
      "fn": 1,
      "tn": 39,
      "precision": null,
      "recall": 0
    }
  },
  "groups": {
    "mark": {
      "tp": 7,
      "fp": 0,
      "fn": 0,
      "tn": 113,
      "precision": 1,
      "recall": 1
    },
    "keyword": {
      "tp": 5,
      "fp": 0,
      "fn": 0,
      "tn": 35,
      "precision": 1,
      "recall": 1
    },
    "personal": {
      "tp": 9,
      "fp": 0,
      "fn": 1,
      "tn": 110,
      "precision": 1,
      "recall": 0.9
    },
    "network": {
      "tp": 4,
      "fp": 0,
      "fn": 1,
      "tn": 115,
      "precision": 1,
      "recall": 0.8
    },
    "metadata": {
      "tp": 8,
      "fp": 0,
      "fn": 3,
      "tn": 269,
      "precision": 1,
      "recall": 0.7272727272727273
    }
  },
  "total": {
    "tp": 33,
    "fp": 0,
    "fn": 5,
    "tn": 642,
    "precision": 1,
    "recall": 0.868421052631579
  },
  "countExact": {
    "correct": 33,
    "total": 38,
    "ratio": 0.868421052631579
  },
  "routing": {
    "internal": 40,
    "national": 40,
    "ai": 40,
    "outside": 40
  },
  "rejectCorrect": 4,
  "performanceByFormat": {
    "txt": {
      "samples": 30,
      "medianMs": 0.1868,
      "p95Ms": 1.2431,
      "maxMs": 4.5638
    },
    "docx": {
      "samples": 75,
      "medianMs": 0.4113,
      "p95Ms": 0.8284,
      "maxMs": 4.5565
    },
    "xlsx": {
      "samples": 45,
      "medianMs": 0.4599,
      "p95Ms": 1.044,
      "maxMs": 1.9228
    },
    "pptx": {
      "samples": 30,
      "medianMs": 0.5838,
      "p95Ms": 7.7415,
      "maxMs": 15.5004
    },
    "pdf": {
      "samples": 40,
      "medianMs": 2.1801,
      "p95Ms": 6.1428,
      "maxMs": 275.4378
    }
  },
  "failures": 5
}
```
