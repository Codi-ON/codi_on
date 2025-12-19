TRAIN_CONFIG = {
    "input_dim": 3,
    "use_ap": False,
    "hidden_dims": [32, 16],
    "activation": "relu",
    "dropout": 0.1,

    "batch_size": 32,
    "epochs": 200,

    "optimizer": "adam",
    "learning_rate": 5e-3,

    "loss": "mse",

    # early stopping
    "early_stopping": True,
    "es_patience": 20, # epoch 기준
    "es_min_delta": 2e-4, # 최소 변화량
    "es_monitor": "loss", # loss | acc
}
