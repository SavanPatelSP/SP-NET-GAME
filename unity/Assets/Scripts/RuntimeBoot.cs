using UnityEngine;

public static class RuntimeBoot
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Init()
    {
        if (GameBootstrap.Exists) return;
        var go = new GameObject("SPNET_Bootstrap");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<GameBootstrap>();
    }
}
