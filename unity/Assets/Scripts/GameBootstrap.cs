using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Networking;
using UnityEngine.UI;

public class GameBootstrap : MonoBehaviour
{
    public static GameBootstrap Instance { get; private set; }
    public static bool Exists => Instance != null;

    public string GameName => "SP NET GAMERS";
    public string Version => "v1.0.1";

    [Header("Match Settings")]
    [SerializeField] private int botCount = 28;
    [SerializeField] private int lootCount = 50;
    [SerializeField] private int obstacleCount = 18;
    [SerializeField] private float worldSize = 200f;
    [SerializeField] private float zoneDamagePerSecond = 14f;
    [SerializeField] private float warmupDuration = 4f;

    public float WorldSize => worldSize;
    public float BotAggroRange => 35f;
    public float BotAttackRange => 22f;

    public PlayerController Player => player;
    public Vector2 LeftJoystickValue => leftJoystick != null ? leftJoystick.Value : Vector2.zero;
    public Vector2 RightJoystickValue => rightJoystick != null ? rightJoystick.Value : Vector2.zero;
    public bool MatchLive => warmupTimer <= 0f;
    public float WarmupRemaining => warmupTimer;

    private PlayerController player;
    private readonly List<BotController> bots = new List<BotController>();
    private readonly List<LootPickup> loot = new List<LootPickup>();
    private readonly List<GameObject> worldObjects = new List<GameObject>();

    private WeaponDef[] weaponDefs;

    private VirtualJoystick leftJoystick;
    private VirtualJoystick rightJoystick;

    private Text healthText;
    private Text armorText;
    private Text weaponText;
    private Text remainText;
    private Text statusText;
    private Text nameText;
    private Text gemsText;
    private Text coinsText;
    private Text levelText;
    private Text xpText;
    private Text storeStatusText;
    private Text adminStatusText;
    private Text profileStatusText;
    private Text profileSummaryText;
    private Text missionsText;
    private Text battlePassText;
    private Text authStatusText;

    private GameObject storePanel;
    private GameObject adminPanel;
    private GameObject profilePanel;
    private GameObject authPanel;

    [Header("Cloud Settings")]
    [SerializeField] private string apiBase = "http://localhost:8787";
    private string authToken;
    private bool cloudEnabled;
    private InputField emailField;
    private InputField passwordField;
    private const float PowerOutMult = 1.3f;
    private const float PowerInMult = 0.8f;

    private const string KeyGems = "SPNET_GEMS";
    private const string KeyCoins = "SPNET_COINS";
    private const string KeyLevel = "SPNET_LEVEL";
    private const string KeyXp = "SPNET_XP";
    private const string KeyStreak = "SPNET_STREAK";
    private const string KeyLastReward = "SPNET_LAST_REWARD";
    private const string KeyName = "SPNET_NAME";
    private const string KeyMatches = "SPNET_MATCHES";
    private const string KeyLifetimeKills = "SPNET_LIFETIME_KILLS";
    private const string KeyBattleXp = "SPNET_BATTLE_XP";
    private const string KeyBattleTier = "SPNET_BATTLE_TIER";
    private const string KeyMissionsDate = "SPNET_MISSIONS_DATE";
    private const string KeyMissionsJson = "SPNET_MISSIONS_JSON";
    private const string KeyAuthToken = "SPNET_AUTH_TOKEN";
    private const string KeyPowerBoost = "SPNET_POWER_BOOST";
    private int spGems;
    private int spCoins;
    private int level;
    private int xp;
    private int streak;
    private int matches;
    private int lifetimeKills;
    private int battleXp;
    private int battleTier;
    private bool powerBoost;
    private string playerName = "LocalPlayer";
    private string lastRewardDate = "";
    private bool matchRewarded;
    private float warmupTimer;

    [Serializable]
    private class Mission
    {
        public string id;
        public string title;
        public int target;
        public int progress;
        public int rewardCoins;
        public int rewardGems;
        public int rewardXp;
        public bool claimed;
    }

    private Mission[] missions;

    private LineRenderer zoneLine;
    private float zoneRadius;
    private int zoneIndex;
    private float zoneTimer;
    private int mapVariant;
    private int modeVariant;
    private string mapName = "Ridgefront";
    private string modeName = "Classic";

    private struct ZonePhase
    {
        public float wait;
        public float shrink;
        public float radius;
        public ZonePhase(float wait, float shrink, float radius)
        {
            this.wait = wait;
            this.shrink = shrink;
            this.radius = radius;
        }
    }

    private ZonePhase[] phases;
    private ZonePhase[] basePhases;

    private readonly Mission[] missionTemplates = new Mission[]
    {
        new Mission { id = "play_1", title = "Play 1 match", target = 1, rewardCoins = 120, rewardGems = 0, rewardXp = 80, progress = 0, claimed = false },
        new Mission { id = "kills_3", title = "Get 3 kills", target = 3, rewardCoins = 150, rewardGems = 0, rewardXp = 120, progress = 0, claimed = false },
        new Mission { id = "win_1", title = "Win 1 match", target = 1, rewardCoins = 200, rewardGems = 1, rewardXp = 160, progress = 0, claimed = false },
    };

    [Serializable]
    private class CloudUser
    {
        public string name;
        public string email;
        public string role;
    }

    [Serializable]
    private class CloudProfile
    {
        public int level;
        public int xp;
        public int streak;
        public string last_reward;
        public int matches;
        public int lifetime_kills;
        public int battle_xp;
        public int battle_tier;
    }

    [Serializable]
    private class CloudBalances
    {
        public int coins;
        public int gems;
    }

    [Serializable]
    private class CloudResponse
    {
        public bool ok;
        public string token;
        public CloudUser user;
        public CloudProfile profile;
        public CloudBalances balances;
        public string[] inventory;
    }

    [Serializable]
    private class ClaimDailyResponse
    {
        public bool ok;
        public int coins;
        public int gems;
        public int streak;
        public string error;
    }

    [Serializable]
    private class MatchReportResponse
    {
        public bool ok;
        public int xp;
        public int coins;
        public int gems;
        public string error;
    }

    [Serializable]
    private class LoginPayload
    {
        public string email;
        public string password;
    }

    [Serializable]
    private class RegisterPayload
    {
        public string email;
        public string password;
        public string name;
    }

    [Serializable]
    private class MatchPayload
    {
        public int kills;
        public bool won;
    }

    [Serializable]
    private class BuyResponse
    {
        public bool ok;
        public int coins;
        public int gems;
        public string error;
    }

    [Serializable]
    private class OfferPayload
    {
        public string offerId;
    }

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;

        Application.targetFrameRate = 60;
        CreateDefinitions();
        LoadEconomy();
        LoadProfile();
        LoadMissions();
        LoadAuthToken();
        CreateUI();
        StartMatch();

        if (!string.IsNullOrEmpty(authToken))
        {
            StartCoroutine(FetchCloudProfile());
        }
    }

    private void Update()
    {
        if (player == null) return;

        float dt = Time.deltaTime;
        if (warmupTimer > 0f)
        {
            warmupTimer = Mathf.Max(0f, warmupTimer - dt);
        }

        if (MatchLive)
        {
            UpdateZone(dt);
            ApplyZoneDamage(dt);
        }
        UpdateLootPickups();
        UpdateBoosts(dt);
        UpdateHUD();

        if (Input.GetKeyDown(KeyCode.R))
        {
            RestartMatch();
        }
    }

    private void LoadEconomy()
    {
        spGems = PlayerPrefs.GetInt(KeyGems, 25);
        spCoins = PlayerPrefs.GetInt(KeyCoins, 1000);
    }

    private void SaveEconomy()
    {
        PlayerPrefs.SetInt(KeyGems, spGems);
        PlayerPrefs.SetInt(KeyCoins, spCoins);
        PlayerPrefs.Save();
    }

    private void AddGems(int amount)
    {
        if (amount <= 0) return;
        spGems += amount;
        SaveEconomy();
        UpdateEconomyUI();
    }

    private void AddCoins(int amount)
    {
        if (amount <= 0) return;
        spCoins += amount;
        SaveEconomy();
        UpdateEconomyUI();
    }

    private bool SpendGems(int amount)
    {
        if (amount <= 0) return true;
        if (spGems < amount)
        {
            SetStoreStatus("Not enough SP Gems.");
            return false;
        }
        spGems -= amount;
        SaveEconomy();
        UpdateEconomyUI();
        return true;
    }

    private bool SpendCoins(int amount)
    {
        if (amount <= 0) return true;
        if (spCoins < amount)
        {
            SetStoreStatus("Not enough SP Coins.");
            return false;
        }
        spCoins -= amount;
        SaveEconomy();
        UpdateEconomyUI();
        return true;
    }

    private void LoadProfile()
    {
        playerName = PlayerPrefs.GetString(KeyName, "LocalPlayer");
        level = Mathf.Max(1, PlayerPrefs.GetInt(KeyLevel, 1));
        xp = Mathf.Max(0, PlayerPrefs.GetInt(KeyXp, 0));
        streak = Mathf.Max(0, PlayerPrefs.GetInt(KeyStreak, 0));
        lastRewardDate = PlayerPrefs.GetString(KeyLastReward, "");
        matches = Mathf.Max(0, PlayerPrefs.GetInt(KeyMatches, 0));
        lifetimeKills = Mathf.Max(0, PlayerPrefs.GetInt(KeyLifetimeKills, 0));
        battleXp = Mathf.Max(0, PlayerPrefs.GetInt(KeyBattleXp, 0));
        battleTier = Mathf.Max(1, PlayerPrefs.GetInt(KeyBattleTier, 1));
        powerBoost = PlayerPrefs.GetInt(KeyPowerBoost, 0) == 1;
    }

    private void SaveProfile()
    {
        PlayerPrefs.SetString(KeyName, playerName);
        PlayerPrefs.SetInt(KeyLevel, level);
        PlayerPrefs.SetInt(KeyXp, xp);
        PlayerPrefs.SetInt(KeyStreak, streak);
        PlayerPrefs.SetString(KeyLastReward, lastRewardDate);
        PlayerPrefs.SetInt(KeyMatches, matches);
        PlayerPrefs.SetInt(KeyLifetimeKills, lifetimeKills);
        PlayerPrefs.SetInt(KeyBattleXp, battleXp);
        PlayerPrefs.SetInt(KeyBattleTier, battleTier);
        PlayerPrefs.SetInt(KeyPowerBoost, powerBoost ? 1 : 0);
        PlayerPrefs.Save();
    }

    private void LoadMissions()
    {
        string date = PlayerPrefs.GetString(KeyMissionsDate, "");
        string today = DateTime.Now.ToString("yyyy-MM-dd");
        if (date != today)
        {
            missions = new Mission[missionTemplates.Length];
            for (int i = 0; i < missionTemplates.Length; i++)
            {
                Mission t = missionTemplates[i];
                missions[i] = new Mission
                {
                    id = t.id,
                    title = t.title,
                    target = t.target,
                    rewardCoins = t.rewardCoins,
                    rewardGems = t.rewardGems,
                    rewardXp = t.rewardXp,
                    progress = 0,
                    claimed = false
                };
            }
            PlayerPrefs.SetString(KeyMissionsDate, today);
            SaveMissions();
            return;
        }

        string json = PlayerPrefs.GetString(KeyMissionsJson, "");
        if (!string.IsNullOrEmpty(json))
        {
            MissionList wrapper = JsonUtility.FromJson<MissionList>(json);
            if (wrapper != null && wrapper.items != null)
            {
                missions = wrapper.items;
                return;
            }
        }

        missions = new Mission[0];
    }

    [Serializable]
    private class MissionList
    {
        public Mission[] items;
    }

    private void SaveMissions()
    {
        MissionList wrapper = new MissionList { items = missions };
        PlayerPrefs.SetString(KeyMissionsJson, JsonUtility.ToJson(wrapper));
        PlayerPrefs.Save();
    }

    private void LoadAuthToken()
    {
        authToken = PlayerPrefs.GetString(KeyAuthToken, "");
        cloudEnabled = !string.IsNullOrEmpty(authToken);
    }

    private void SaveAuthToken()
    {
        PlayerPrefs.SetString(KeyAuthToken, authToken);
        PlayerPrefs.Save();
    }

    private int XpToNext(int lvl)
    {
        return 150 + (lvl * 50);
    }

    private int BattleXpToNext(int tier)
    {
        return 1000 + (tier * 200);
    }

    private string TodayKey()
    {
        DateTime now = DateTime.Now;
        return now.ToString("yyyy-MM-dd");
    }

    private int DaysBetween(string from, string to)
    {
        DateTime a;
        DateTime b;
        if (!DateTime.TryParse(from, out a) || !DateTime.TryParse(to, out b)) return 999;
        return (int)(b.Date - a.Date).TotalDays;
    }

    private bool CanClaimDaily()
    {
        string today = TodayKey();
        return lastRewardDate != today;
    }

    private void ClaimDailyReward()
    {
        if (cloudEnabled)
        {
            StartCoroutine(ClaimDailyCloud());
            return;
        }

        if (!CanClaimDaily())
        {
            SetProfileStatus("Daily reward already claimed.");
            return;
        }

        string today = TodayKey();
        int dayDiff = string.IsNullOrEmpty(lastRewardDate) ? 999 : DaysBetween(lastRewardDate, today);
        if (dayDiff == 1)
        {
            streak += 1;
        }
        else
        {
            streak = 1;
        }

        int coinsReward = 200 + (streak * 20);
        int gemsReward = 5 + (streak / 3);
        spCoins += coinsReward;
        spGems += gemsReward;
        lastRewardDate = today;

        SaveProfile();
        SaveEconomy();
        UpdateEconomyUI();
        UpdateProfileUI();
        SetProfileStatus($"Daily claimed: +{coinsReward} Coins, +{gemsReward} Gems (Streak {streak}).");
    }

    private IEnumerator ClaimDailyCloud()
    {
        string json = "{}";
        using (UnityWebRequest req = BuildRequest("/api/claim_daily", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                SetProfileStatus("Cloud error while claiming.");
                yield break;
            }
            ClaimDailyResponse resp = JsonUtility.FromJson<ClaimDailyResponse>(req.downloadHandler.text);
            if (resp == null || !resp.ok)
            {
                SetProfileStatus("Daily already claimed.");
                yield break;
            }
        }
        yield return FetchCloudProfile();
        SetProfileStatus("Daily claimed via cloud.");
    }

    private IEnumerator BuyOfferCloud(string offerId, string successMessage)
    {
        string json = JsonUtility.ToJson(new OfferPayload { offerId = offerId });
        using (UnityWebRequest req = BuildRequest("/api/store/buy", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                SetStoreStatus("Cloud purchase failed.");
                yield break;
            }
            BuyResponse resp = JsonUtility.FromJson<BuyResponse>(req.downloadHandler.text);
            if (resp == null || !resp.ok)
            {
                SetStoreStatus("Not enough funds or offer expired.");
                yield break;
            }
        }
        yield return FetchCloudProfile();
        SetStoreStatus(successMessage);
    }

    private void CreateDefinitions()
    {
        weaponDefs = new WeaponDef[]
        {
            new WeaponDef { id = "Rift-19", type = "AR", fireRate = 9f, damage = 14f, bulletSpeed = 70f, spread = 1.8f, range = 70f },
            new WeaponDef { id = "Viper-K", type = "SMG", fireRate = 13f, damage = 10f, bulletSpeed = 60f, spread = 3.0f, range = 55f },
            new WeaponDef { id = "Grave-12", type = "SG", fireRate = 1.1f, damage = 48f, bulletSpeed = 55f, spread = 7f, range = 26f },
            new WeaponDef { id = "Siren-12", type = "DMR", fireRate = 3.5f, damage = 28f, bulletSpeed = 86f, spread = 1.2f, range = 82f },
            new WeaponDef { id = "Warden", type = "SN", fireRate = 0.8f, damage = 85f, bulletSpeed = 98f, spread = 0.8f, range = 110f },
            new WeaponDef { id = "Bearclaw", type = "LMG", fireRate = 8f, damage = 16f, bulletSpeed = 68f, spread = 2.2f, range = 70f },
        };

        basePhases = new ZonePhase[]
        {
            new ZonePhase(6f, 14f, 100f),
            new ZonePhase(5f, 12f, 82f),
            new ZonePhase(4f, 10f, 62f),
            new ZonePhase(3f, 9f, 46f),
            new ZonePhase(2f, 8f, 32f),
            new ZonePhase(1f, 8f, 22f),
            new ZonePhase(0f, 10f, 14f),
        };
        phases = basePhases;
    }

    private void SelectMatchVariant()
    {
        mapVariant = UnityEngine.Random.Range(0, 3);
        modeVariant = UnityEngine.Random.Range(0, 3);

        if (mapVariant == 0) mapName = "Ridgefront";
        else if (mapVariant == 1) mapName = "Harborline";
        else mapName = "Metro Grid";

        if (modeVariant == 0) modeName = "Classic";
        else if (modeVariant == 1) modeName = "Blitz";
        else modeName = "Vehicle Rush";

        ApplyModeSettings();
    }

    private void ApplyModeSettings()
    {
        float phaseScale = 1f;
        zoneDamagePerSecond = 14f;
        if (modeName == "Blitz")
        {
            botCount = 18;
            lootCount = 42;
            phaseScale = 0.7f;
            zoneDamagePerSecond = 18f;
        }
        else if (modeName == "Vehicle Rush")
        {
            botCount = 24;
            lootCount = 55;
            phaseScale = 0.85f;
            zoneDamagePerSecond = 16f;
        }
        else
        {
            botCount = 28;
            lootCount = 50;
            phaseScale = 1f;
        }
        phases = ScalePhases(phaseScale);
    }

    private ZonePhase[] ScalePhases(float scale)
    {
        ZonePhase[] scaled = new ZonePhase[basePhases.Length];
        for (int i = 0; i < basePhases.Length; i++)
        {
            ZonePhase p = basePhases[i];
            scaled[i] = new ZonePhase(Mathf.Max(0f, p.wait * scale), Mathf.Max(1f, p.shrink * scale), p.radius);
        }
        return scaled;
    }

    private void StartMatch()
    {
        ClearWorld();
        SelectMatchVariant();
        CreateLighting();
        CreateWorld();
        SpawnPlayer();
        SpawnBots();
        SpawnLoot();
        SetupCamera();
        SetupZone();
        matchRewarded = false;
        warmupTimer = warmupDuration;
    }

    private void RestartMatch()
    {
        StartMatch();
    }

    private void ClearWorld()
    {
        foreach (GameObject obj in worldObjects)
        {
            if (obj != null) Destroy(obj);
        }
        worldObjects.Clear();
        bots.Clear();
        loot.Clear();
        zoneLine = null;
    }

    private void CreateLighting()
    {
        if (FindObjectOfType<Light>() != null) return;
        GameObject lightObj = new GameObject("Directional Light");
        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.1f;
        lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
        worldObjects.Add(lightObj);
    }

    private void CreateWorld()
    {
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        float scale = worldSize / 10f;
        ground.transform.localScale = new Vector3(scale, 1f, scale);
        ground.transform.position = Vector3.zero;
        if (mapVariant == 1) SetColor(ground, new Color(0.05f, 0.1f, 0.14f));
        else if (mapVariant == 2) SetColor(ground, new Color(0.08f, 0.08f, 0.12f));
        else SetColor(ground, new Color(0.06f, 0.09f, 0.16f));
        worldObjects.Add(ground);

        for (int i = 0; i < obstacleCount; i++)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.name = "Obstacle";
            float w = Random.Range(6f, 12f);
            float h = Random.Range(2f, 5f);
            float d = Random.Range(5f, 10f);
            float half = worldSize * 0.5f - 8f;
            float x = Random.Range(-half, half);
            float z = Random.Range(-half, half);

            if (mapVariant == 1 && i % 3 == 0)
            {
                w = Random.Range(12f, 18f);
                d = Random.Range(4f, 7f);
                z = Random.Range(-half, 0f);
            }
            else if (mapVariant == 2)
            {
                float grid = 18f;
                x = Mathf.Round(x / grid) * grid;
                z = Mathf.Round(z / grid) * grid;
                w = Random.Range(6f, 10f);
                d = Random.Range(6f, 10f);
            }

            cube.transform.position = new Vector3(x, h * 0.5f, z);
            cube.transform.localScale = new Vector3(w, h, d);
            SetColor(cube, new Color(0.12f, 0.15f, 0.22f));
            worldObjects.Add(cube);
        }
    }

    private void SpawnPlayer()
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        obj.name = "Player";
        Destroy(obj.GetComponent<Collider>());
        CharacterController controller = obj.AddComponent<CharacterController>();
        controller.height = 2f;
        controller.radius = 0.45f;
        controller.center = new Vector3(0f, 1f, 0f);

        Combatant combatant = obj.AddComponent<Combatant>();
        combatant.id = "player";
        combatant.isPlayer = true;
        combatant.maxHealth = 100f;
        combatant.health = 100f;
        combatant.armor = 0f;
        combatant.speed = 10.5f;
        combatant.weapon = weaponDefs[0];
        combatant.damageOutMult = powerBoost ? PowerOutMult : 1f;
        combatant.damageInMult = powerBoost ? PowerInMult : 1f;

        obj.AddComponent<PlayerController>();

        float spawnRange = 12f;
        obj.transform.position = new Vector3(Random.Range(-spawnRange, spawnRange), 0f, Random.Range(-spawnRange, spawnRange));
        SetColor(obj, new Color(0.3f, 0.8f, 1f));

        player = obj.GetComponent<PlayerController>();
        worldObjects.Add(obj);
    }

    private void SpawnBots()
    {
        float half = worldSize * 0.5f - 6f;
        for (int i = 0; i < botCount; i++)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            obj.name = "Bot";
            Destroy(obj.GetComponent<Collider>());
            CharacterController controller = obj.AddComponent<CharacterController>();
            controller.height = 2f;
            controller.radius = 0.45f;
            controller.center = new Vector3(0f, 1f, 0f);

            Combatant combatant = obj.AddComponent<Combatant>();
            combatant.id = "bot-" + i;
            combatant.isPlayer = false;
            combatant.maxHealth = 100f;
            combatant.health = Random.Range(80f, 110f);
            combatant.armor = Random.value < 0.4f ? 25f : 0f;
            combatant.speed = Random.Range(8.5f, 10f);
            combatant.weapon = weaponDefs[Random.Range(0, weaponDefs.Length)];

            obj.AddComponent<BotController>();
            obj.transform.position = new Vector3(Random.Range(-half, half), 0f, Random.Range(-half, half));
            SetColor(obj, new Color(1f, 0.42f, 0.42f));

            BotController bot = obj.GetComponent<BotController>();
            bots.Add(bot);
            worldObjects.Add(obj);
        }
    }

    private void SpawnLoot()
    {
        float half = worldSize * 0.5f - 6f;
        for (int i = 0; i < lootCount; i++)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            obj.name = "Loot";
            obj.transform.localScale = Vector3.one * 1.2f;
            obj.transform.position = new Vector3(Random.Range(-half, half), 0.6f, Random.Range(-half, half));
            LootPickup lp = obj.AddComponent<LootPickup>();

            float roll = Random.value;
            if (roll > 0.96f)
            {
                lp.kind = LootKind.Vehicle;
                SetColor(obj, new Color(1f, 0.55f, 0.2f));
            }
            else if (roll > 0.9f)
            {
                lp.kind = LootKind.Med;
                SetColor(obj, new Color(0.4f, 1f, 0.6f));
            }
            else if (roll > 0.7f)
            {
                lp.kind = LootKind.Armor;
                SetColor(obj, new Color(0.4f, 0.8f, 1f));
            }
            else
            {
                lp.kind = LootKind.Weapon;
                lp.weaponIndex = Random.Range(0, weaponDefs.Length);
                SetColor(obj, new Color(1f, 0.85f, 0.4f));
            }

            loot.Add(lp);
            worldObjects.Add(obj);
        }
    }

    private void SetupCamera()
    {
        Camera cam = Camera.main;
        if (cam == null)
        {
            GameObject camObj = new GameObject("Main Camera");
            cam = camObj.AddComponent<Camera>();
            cam.tag = "MainCamera";
            worldObjects.Add(camObj);
        }

        CameraFollow follow = cam.GetComponent<CameraFollow>();
        if (follow == null) follow = cam.gameObject.AddComponent<CameraFollow>();
        follow.target = player.transform;
    }

    private void SetupZone()
    {
        zoneIndex = 0;
        zoneTimer = 0f;
        zoneRadius = phases[0].radius;

        GameObject zoneObj = new GameObject("Zone");
        zoneLine = zoneObj.AddComponent<LineRenderer>();
        zoneLine.positionCount = 64;
        zoneLine.widthMultiplier = 0.3f;
        zoneLine.useWorldSpace = true;
        zoneLine.material = new Material(Shader.Find("Sprites/Default"));
        zoneLine.startColor = new Color(0.3f, 0.9f, 0.7f, 0.8f);
        zoneLine.endColor = new Color(0.3f, 0.9f, 0.7f, 0.8f);
        worldObjects.Add(zoneObj);
        UpdateZoneLine();
    }

    private void UpdateZone(float dt)
    {
        if (zoneIndex >= phases.Length - 1) return;

        ZonePhase phase = phases[zoneIndex];
        ZonePhase next = phases[zoneIndex + 1];
        zoneTimer += dt;

        if (zoneTimer < phase.wait)
        {
            zoneRadius = phase.radius;
        }
        else
        {
            float shrinkTime = zoneTimer - phase.wait;
            float t = Mathf.Clamp01(shrinkTime / phase.shrink);
            zoneRadius = Mathf.Lerp(phase.radius, next.radius, t);
            if (t >= 1f)
            {
                zoneIndex++;
                zoneTimer = 0f;
            }
        }

        UpdateZoneLine();
    }

    private void UpdateZoneLine()
    {
        if (zoneLine == null) return;
        int count = zoneLine.positionCount;
        for (int i = 0; i < count; i++)
        {
            float angle = (float)i / count * Mathf.PI * 2f;
            float x = Mathf.Cos(angle) * zoneRadius;
            float z = Mathf.Sin(angle) * zoneRadius;
            zoneLine.SetPosition(i, new Vector3(x, 0.2f, z));
        }
    }

    private void ApplyZoneDamage(float dt)
    {
        if (player != null && player.combatant.alive)
        {
            float d = Vector3.Distance(Vector3.zero, player.transform.position);
            if (d > zoneRadius) player.combatant.ApplyDamage(zoneDamagePerSecond * dt);
        }

        foreach (BotController bot in bots)
        {
            if (bot == null || !bot.combatant.alive) continue;
            float d = Vector3.Distance(Vector3.zero, bot.transform.position);
            if (d > zoneRadius) bot.combatant.ApplyDamage(zoneDamagePerSecond * dt);
        }
    }

    private void UpdateLootPickups()
    {
        if (player == null) return;
        foreach (LootPickup lp in loot)
        {
            if (lp == null || lp.taken) continue;

            if (Vector3.Distance(player.transform.position, lp.transform.position) < 3.2f)
            {
                ApplyLoot(player.combatant, lp);
                continue;
            }

            foreach (BotController bot in bots)
            {
                if (bot == null || !bot.combatant.alive) continue;
                if (Vector3.Distance(bot.transform.position, lp.transform.position) < 3.2f)
                {
                    ApplyLoot(bot.combatant, lp);
                    break;
                }
            }
        }
    }

    private void ApplyLoot(Combatant c, LootPickup lp)
    {
        if (lp.taken) return;
        lp.taken = true;
        if (lp.kind == LootKind.Weapon)
        {
            c.weapon = weaponDefs[Mathf.Clamp(lp.weaponIndex, 0, weaponDefs.Length - 1)];
        }
        else if (lp.kind == LootKind.Armor)
        {
            c.armor = Mathf.Min(50f, c.armor + 25f);
        }
        else if (lp.kind == LootKind.Med)
        {
            c.health = Mathf.Min(c.maxHealth, c.health + 35f);
        }
        else if (lp.kind == LootKind.Vehicle)
        {
            ActivateVehicle(c);
        }
        lp.gameObject.SetActive(false);
    }

    private void ActivateVehicle(Combatant c)
    {
        if (c == null) return;
        c.boostTimer = 6f;
        c.speedMult = 1.6f;
    }

    private void UpdateBoosts(float dt)
    {
        if (player != null) UpdateBoost(player.combatant, dt);
        foreach (BotController bot in bots)
        {
            if (bot == null) continue;
            UpdateBoost(bot.combatant, dt);
        }
    }

    private void UpdateBoost(Combatant c, float dt)
    {
        if (c == null) return;
        if (c.boostTimer > 0f)
        {
            c.boostTimer -= dt;
            if (c.boostTimer <= 0f)
            {
                c.boostTimer = 0f;
                c.speedMult = 1f;
            }
            else
            {
                c.speedMult = 1.6f;
            }
        }
    }

    public void Fire(Combatant shooter, Vector3 direction)
    {
        if (shooter == null || !shooter.alive) return;
        if (!MatchLive) return;
        if (shooter.weapon == null) return;
        if (shooter.cooldown > 0f) return;

        WeaponDef w = shooter.weapon;
        shooter.cooldown = 1f / Mathf.Max(0.1f, w.fireRate);

        float spread = Random.Range(-w.spread, w.spread);
        Vector3 dir = Quaternion.Euler(0f, spread, 0f) * direction.normalized;

        GameObject bullet = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        bullet.transform.localScale = Vector3.one * 0.35f;
        bullet.transform.position = shooter.transform.position + dir * 1.1f + Vector3.up * 1f;
        Destroy(bullet.GetComponent<Collider>());
        SetColor(bullet, Color.white);

        BulletMover bm = bullet.AddComponent<BulletMover>();
        bm.owner = shooter;
        bm.direction = dir;
        bm.speed = w.bulletSpeed;
        bm.damage = w.damage * shooter.damageOutMult;
        bm.life = w.range / Mathf.Max(1f, w.bulletSpeed);

        worldObjects.Add(bullet);
    }

    public Combatant FindHit(Vector3 point, Combatant owner)
    {
        float hitRadius = 0.9f;
        if (player != null && player.combatant != owner && player.combatant.alive)
        {
            if (Vector3.Distance(point, player.transform.position + Vector3.up) < hitRadius)
            {
                return player.combatant;
            }
        }

        foreach (BotController bot in bots)
        {
            if (bot == null || bot.combatant == owner || !bot.combatant.alive) continue;
            if (Vector3.Distance(point, bot.transform.position + Vector3.up) < hitRadius)
            {
                return bot.combatant;
            }
        }
        return null;
    }

    public void SetPlayerWeapon(int index)
    {
        if (player == null) return;
        index = Mathf.Clamp(index, 0, weaponDefs.Length - 1);
        player.combatant.weapon = weaponDefs[index];
    }

    private void UpdateHUD()
    {
        if (healthText == null || player == null) return;
        healthText.text = $"HP: {Mathf.Max(0, Mathf.RoundToInt(player.combatant.health))}/{player.combatant.maxHealth}";
        armorText.text = $"Armor: {Mathf.RoundToInt(player.combatant.armor)}";
        weaponText.text = $"Weapon: {player.combatant.weapon.id}";
        UpdateEconomyUI();
        UpdateProfileUI();

        int alive = player.combatant.alive ? 1 : 0;
        foreach (BotController bot in bots) if (bot != null && bot.combatant.alive) alive++;
        remainText.text = $"Remaining: {alive}  Kills: {player.combatant.kills}";

        bool isWinner = player.combatant.alive && alive == 1;
        bool isEliminated = !player.combatant.alive;
        if (!matchRewarded && (isWinner || isEliminated))
        {
            AwardMatchRewards(isWinner, player.combatant.kills);
            matchRewarded = true;
        }

        if (matchRewarded && (isWinner || isEliminated))
        {
            return;
        }

        if (!MatchLive)
        {
            statusText.text = $"WARM-UP {Mathf.CeilToInt(warmupTimer)}";
            return;
        }

        if (!player.combatant.alive)
        {
            statusText.text = "ELIMINATED - Press R to restart";
        }
        else if (alive == 1)
        {
            statusText.text = "WINNER - Press R to restart";
        }
        else
        {
            statusText.text = "";
        }
    }

    private void UpdateEconomyUI()
    {
        if (gemsText != null) gemsText.text = $"SP Gems: {spGems}";
        if (coinsText != null) coinsText.text = $"SP Coins: {spCoins}";
        if (levelText != null) levelText.text = $"Level {level}";
        if (xpText != null) xpText.text = $"XP {xp}/{XpToNext(level)}";
        if (nameText != null) nameText.text = $"{GameName} {Version} | {playerName} | {modeName} @ {mapName}";
    }

    private void UpdateProfileUI()
    {
        if (profileSummaryText == null) return;
        profileSummaryText.text =
            $"Name: {playerName}\\n" +
            $"Level: {level}  XP: {xp}/{XpToNext(level)}\\n" +
            $"Streak: {streak} days\\n" +
            $"Matches: {matches}\\n" +
            $"Lifetime Kills: {lifetimeKills}\\n" +
            $"Power Boost: {(powerBoost ? "Active (60%)" : "Inactive")}";

        if (battlePassText != null)
        {
            battlePassText.text = $"Battle Pass: Tier {battleTier}  XP {battleXp}/{BattleXpToNext(battleTier)}";
        }

        if (missionsText != null && missions != null && missions.Length > 0)
        {
            string lines = "";
            foreach (Mission m in missions)
            {
                string status = m.claimed ? "Claimed" : $"{m.progress}/{m.target}";
                lines += $"{m.title} - {status}\\n";
            }
            missionsText.text = lines.TrimEnd();
        }
    }

    private void SetStoreStatus(string message)
    {
        if (storeStatusText != null) storeStatusText.text = message;
    }

    private void SetAdminStatus(string message)
    {
        if (adminStatusText != null) adminStatusText.text = message;
    }

    private void SetProfileStatus(string message)
    {
        if (profileStatusText != null) profileStatusText.text = message;
    }

    private UnityWebRequest BuildRequest(string path, string json)
    {
        byte[] body = Encoding.UTF8.GetBytes(json ?? "{}");
        UnityWebRequest req = new UnityWebRequest(apiBase + path, "POST");
        req.uploadHandler = new UploadHandlerRaw(body);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        if (!string.IsNullOrEmpty(authToken))
        {
            req.SetRequestHeader("Authorization", "Bearer " + authToken);
        }
        return req;
    }

    private UnityWebRequest BuildGet(string path)
    {
        UnityWebRequest req = UnityWebRequest.Get(apiBase + path);
        if (!string.IsNullOrEmpty(authToken))
        {
            req.SetRequestHeader("Authorization", "Bearer " + authToken);
        }
        return req;
    }

    private IEnumerator LoginCloud()
    {
        if (emailField == null || passwordField == null) yield break;
        string email = emailField.text.Trim().ToLowerInvariant();
        string pass = passwordField.text.Trim();
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(pass))
        {
            if (authStatusText != null) authStatusText.text = "Enter email + password.";
            yield break;
        }

        string json = JsonUtility.ToJson(new LoginPayload { email = email, password = pass });
        using (UnityWebRequest req = BuildRequest("/api/login", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                if (authStatusText != null) authStatusText.text = "Login failed.";
                yield break;
            }
            CloudResponse resp = JsonUtility.FromJson<CloudResponse>(req.downloadHandler.text);
            if (resp == null || !resp.ok)
            {
                if (authStatusText != null) authStatusText.text = "Invalid credentials.";
                yield break;
            }
            authToken = resp.token;
            SaveAuthToken();
            cloudEnabled = true;
        }

        yield return FetchCloudProfile();
        if (authPanel != null) authPanel.SetActive(false);
        if (authStatusText != null) authStatusText.text = "Cloud connected.";
    }

    private IEnumerator RegisterCloud()
    {
        if (emailField == null || passwordField == null) yield break;
        string email = emailField.text.Trim().ToLowerInvariant();
        string pass = passwordField.text.Trim();
        string name = playerName;
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(pass))
        {
            if (authStatusText != null) authStatusText.text = "Enter email + password.";
            yield break;
        }

        string json = JsonUtility.ToJson(new RegisterPayload { email = email, password = pass, name = name });
        using (UnityWebRequest req = BuildRequest("/api/register", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                if (authStatusText != null) authStatusText.text = "Register failed.";
                yield break;
            }
            if (authStatusText != null) authStatusText.text = "Account created. Now login.";
        }
    }

    private IEnumerator FetchCloudProfile()
    {
        using (UnityWebRequest req = BuildGet("/api/profile"))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                if (authStatusText != null) authStatusText.text = "Cloud sync failed.";
                yield break;
            }
            CloudResponse resp = JsonUtility.FromJson<CloudResponse>(req.downloadHandler.text);
            if (resp == null || !resp.ok) yield break;
            ApplyCloud(resp);
        }
    }

    private void ApplyCloud(CloudResponse resp)
    {
        if (resp.user != null) playerName = resp.user.name;
        if (resp.profile != null)
        {
            level = resp.profile.level;
            xp = resp.profile.xp;
            streak = resp.profile.streak;
            lastRewardDate = resp.profile.last_reward;
            matches = resp.profile.matches;
            lifetimeKills = resp.profile.lifetime_kills;
            battleXp = resp.profile.battle_xp;
            battleTier = resp.profile.battle_tier;
        }
        if (resp.balances != null)
        {
            spCoins = resp.balances.coins;
            spGems = resp.balances.gems;
        }
        if (resp.inventory != null)
        {
            powerBoost = Array.Exists(resp.inventory, item => item == "boost_power60");
        }
        if (player != null && player.combatant != null)
        {
            player.combatant.damageOutMult = powerBoost ? PowerOutMult : 1f;
            player.combatant.damageInMult = powerBoost ? PowerInMult : 1f;
        }
        SaveProfile();
        SaveEconomy();
        UpdateEconomyUI();
        UpdateProfileUI();
    }

    private IEnumerator ReportMatchCloud(bool won, int kills)
    {
        string json = JsonUtility.ToJson(new MatchPayload { kills = kills, won = won });
        using (UnityWebRequest req = BuildRequest("/api/match/report", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
            {
                if (statusText != null) statusText.text = "Cloud report failed.";
                yield break;
            }
            MatchReportResponse resp = JsonUtility.FromJson<MatchReportResponse>(req.downloadHandler.text);
            if (resp == null || !resp.ok) yield break;
        }
        yield return FetchCloudProfile();
        if (won)
        {
            statusText.text = "WINNER - Rewards synced. Press R to restart";
        }
        else
        {
            statusText.text = "ELIMINATED - Rewards synced. Press R to restart";
        }
    }

    private void AwardMatchRewards(bool won, int kills)
    {
        if (cloudEnabled)
        {
            StartCoroutine(ReportMatchCloud(won, kills));
            return;
        }

        int xpEarned = 40 + (kills * 20) + (won ? 120 : 0);
        int coinsEarned = 100 + (kills * 30) + (won ? 200 : 0);
        int gemsEarned = won ? 2 : 0;

        xp += xpEarned;
        while (xp >= XpToNext(level))
        {
            xp -= XpToNext(level);
            level += 1;
        }

        battleXp += xpEarned;
        while (battleXp >= BattleXpToNext(battleTier))
        {
            battleXp -= BattleXpToNext(battleTier);
            battleTier += 1;
        }

        spCoins += coinsEarned;
        spGems += gemsEarned;
        matches += 1;
        lifetimeKills += Mathf.Max(0, kills);

        UpdateMissionsOnMatch(won, kills);
        TryAutoClaimMissions();

        SaveProfile();
        SaveEconomy();
        SaveMissions();
        UpdateEconomyUI();
        UpdateProfileUI();

        if (won)
        {
            statusText.text = $"WINNER - +{xpEarned} XP, +{coinsEarned} Coins, +{gemsEarned} Gems. Press R to restart";
        }
        else
        {
            statusText.text = $"ELIMINATED - +{xpEarned} XP, +{coinsEarned} Coins. Press R to restart";
        }
    }

    private void UpdateMissionsOnMatch(bool won, int kills)
    {
        if (missions == null) return;
        foreach (Mission m in missions)
        {
            if (m.id == "play_1") m.progress = Mathf.Min(m.target, m.progress + 1);
            if (m.id == "kills_3") m.progress = Mathf.Min(m.target, m.progress + kills);
            if (m.id == "win_1" && won) m.progress = Mathf.Min(m.target, m.progress + 1);
        }
    }

    private void TryAutoClaimMissions()
    {
        if (missions == null) return;
        foreach (Mission m in missions)
        {
            if (m.claimed) continue;
            if (m.progress < m.target) continue;
            m.claimed = true;
            spCoins += m.rewardCoins;
            spGems += m.rewardGems;
            xp += m.rewardXp;
            while (xp >= XpToNext(level))
            {
                xp -= XpToNext(level);
                level += 1;
            }
        }
    }

    private void CreateUI()
    {
        Canvas canvas = new GameObject("HUD").AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvas.gameObject.AddComponent<GraphicRaycaster>();

        if (FindObjectOfType<EventSystem>() == null)
        {
            GameObject es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }

        nameText = CreateText(canvas.transform, "Name", new Vector2(12, -10), 16, TextAnchor.UpperLeft);
        nameText.text = $"{GameName} {Version} | {playerName}";

        healthText = CreateText(canvas.transform, "Health", new Vector2(12, -34), 14, TextAnchor.UpperLeft);
        armorText = CreateText(canvas.transform, "Armor", new Vector2(12, -54), 14, TextAnchor.UpperLeft);
        weaponText = CreateText(canvas.transform, "Weapon", new Vector2(12, -74), 14, TextAnchor.UpperLeft);
        remainText = CreateText(canvas.transform, "Remain", new Vector2(12, -94), 14, TextAnchor.UpperLeft);
        statusText = CreateText(canvas.transform, "Status", new Vector2(0, -40), 18, TextAnchor.UpperCenter);

        coinsText = CreateText(canvas.transform, "Coins", new Vector2(-12, -10), 14, TextAnchor.UpperRight);
        gemsText = CreateText(canvas.transform, "Gems", new Vector2(-12, -30), 14, TextAnchor.UpperRight);
        levelText = CreateText(canvas.transform, "Level", new Vector2(-12, -50), 12, TextAnchor.UpperRight);
        xpText = CreateText(canvas.transform, "XP", new Vector2(-12, -68), 12, TextAnchor.UpperRight);

        CreateButton(canvas.transform, "Profile", new Vector2(-12, -96), new Vector2(90, 28), TextAnchor.UpperRight, ToggleProfile);
        CreateButton(canvas.transform, "Store", new Vector2(-12, -128), new Vector2(90, 28), TextAnchor.UpperRight, ToggleStore);
        CreateButton(canvas.transform, "Admin", new Vector2(-12, -160), new Vector2(90, 28), TextAnchor.UpperRight, ToggleAdmin);
        CreateButton(canvas.transform, "Cloud", new Vector2(-12, -192), new Vector2(90, 28), TextAnchor.UpperRight, ToggleAuthPanel);

        storePanel = CreatePanel(canvas.transform, "StorePanel", Vector2.zero, new Vector2(320, 260), TextAnchor.MiddleCenter, new Color(0f, 0f, 0f, 0.7f));
        adminPanel = CreatePanel(canvas.transform, "AdminPanel", Vector2.zero, new Vector2(320, 230), TextAnchor.MiddleCenter, new Color(0f, 0f, 0f, 0.7f));
        profilePanel = CreatePanel(canvas.transform, "ProfilePanel", Vector2.zero, new Vector2(320, 280), TextAnchor.MiddleCenter, new Color(0f, 0f, 0f, 0.7f));
        authPanel = CreatePanel(canvas.transform, "AuthPanel", Vector2.zero, new Vector2(320, 240), TextAnchor.MiddleCenter, new Color(0f, 0f, 0f, 0.7f));

        BuildStorePanel(storePanel.transform);
        BuildAdminPanel(adminPanel.transform);
        BuildProfilePanel(profilePanel.transform);
        BuildAuthPanel(authPanel.transform);

        storePanel.SetActive(false);
        adminPanel.SetActive(false);
        profilePanel.SetActive(false);
        authPanel.SetActive(!cloudEnabled);

        leftJoystick = CreateJoystick(canvas.transform, new Vector2(110, 110), new Vector2(120, 120), TextAnchor.LowerLeft);
        rightJoystick = CreateJoystick(canvas.transform, new Vector2(-110, 110), new Vector2(120, 120), TextAnchor.LowerRight);
    }

    private void ToggleStore()
    {
        if (storePanel == null) return;
        bool next = !storePanel.activeSelf;
        storePanel.SetActive(next);
        if (adminPanel != null) adminPanel.SetActive(false);
        if (profilePanel != null) profilePanel.SetActive(false);
        if (next) SetStoreStatus("Select an item to buy.");
    }

    private void ToggleAdmin()
    {
        if (adminPanel == null) return;
        bool next = !adminPanel.activeSelf;
        adminPanel.SetActive(next);
        if (storePanel != null) storePanel.SetActive(false);
        if (profilePanel != null) profilePanel.SetActive(false);
        if (authPanel != null) authPanel.SetActive(false);
        if (next) SetAdminStatus("DEV ONLY: use for testing.");
    }

    private void ToggleProfile()
    {
        if (profilePanel == null) return;
        bool next = !profilePanel.activeSelf;
        profilePanel.SetActive(next);
        if (storePanel != null) storePanel.SetActive(false);
        if (adminPanel != null) adminPanel.SetActive(false);
        if (authPanel != null) authPanel.SetActive(false);
        if (next)
        {
            UpdateProfileUI();
            SetProfileStatus(CanClaimDaily() ? "Daily reward available." : "Daily reward claimed today.");
        }
    }

    private void ToggleAuthPanel()
    {
        if (authPanel == null) return;
        bool next = !authPanel.activeSelf;
        authPanel.SetActive(next);
        if (storePanel != null) storePanel.SetActive(false);
        if (adminPanel != null) adminPanel.SetActive(false);
        if (profilePanel != null) profilePanel.SetActive(false);
        if (next && authStatusText != null)
        {
            authStatusText.text = cloudEnabled ? "Cloud connected." : "Login to enable cloud save.";
        }
    }

    private void BuildStorePanel(Transform parent)
    {
        Text title = CreateText(parent, "StoreTitle", new Vector2(0, -10), 18, TextAnchor.UpperCenter);
        title.text = "Store";

        Text item1 = CreateText(parent, "Item1", new Vector2(12, -50), 13, TextAnchor.UpperLeft);
        item1.text = "Supply Crate (200 SP Coins)";
        CreateButton(parent, "Buy", new Vector2(-12, -46), new Vector2(80, 26), TextAnchor.UpperRight, () =>
        {
            if (cloudEnabled)
            {
                StartCoroutine(BuyOfferCloud("offer_crate", "Supply Crate unlocked."));
                return;
            }
            if (SpendCoins(200)) SetStoreStatus("Supply Crate unlocked.");
        });

        Text item2 = CreateText(parent, "Item2", new Vector2(12, -85), 13, TextAnchor.UpperLeft);
        item2.text = "Elite Skin (20 SP Gems)";
        CreateButton(parent, "Buy", new Vector2(-12, -81), new Vector2(80, 26), TextAnchor.UpperRight, () =>
        {
            if (cloudEnabled)
            {
                StartCoroutine(BuyOfferCloud("offer_skin", "Elite Skin unlocked."));
                return;
            }
            if (SpendGems(20)) SetStoreStatus("Elite Skin unlocked.");
        });

        Text item3 = CreateText(parent, "Item3", new Vector2(12, -120), 13, TextAnchor.UpperLeft);
        item3.text = "XP Boost (500 SP Coins)";
        CreateButton(parent, "Buy", new Vector2(-12, -116), new Vector2(80, 26), TextAnchor.UpperRight, () =>
        {
            if (cloudEnabled)
            {
                StartCoroutine(BuyOfferCloud("offer_xp", "XP Boost activated."));
                return;
            }
            if (SpendCoins(500)) SetStoreStatus("XP Boost activated.");
        });

        Text item4 = CreateText(parent, "Item4", new Vector2(12, -155), 13, TextAnchor.UpperLeft);
        item4.text = "Power Core (60% Boost) (60 SP Gems)";
        CreateButton(parent, "Buy", new Vector2(-12, -151), new Vector2(80, 26), TextAnchor.UpperRight, () =>
        {
            if (cloudEnabled)
            {
                StartCoroutine(BuyOfferCloud("offer_power60", "Power Boost active."));
                return;
            }
            if (SpendGems(60))
            {
                powerBoost = true;
                SaveProfile();
                UpdateEconomyUI();
                UpdateProfileUI();
                if (player != null && player.combatant != null)
                {
                    player.combatant.damageOutMult = PowerOutMult;
                    player.combatant.damageInMult = PowerInMult;
                }
                SetStoreStatus("Power Boost active.");
            }
        });

        storeStatusText = CreateText(parent, "StoreStatus", new Vector2(0, 12), 12, TextAnchor.LowerCenter);
        storeStatusText.text = "";
    }

    private void BuildAdminPanel(Transform parent)
    {
        Text title = CreateText(parent, "AdminTitle", new Vector2(0, -10), 18, TextAnchor.UpperCenter);
        title.text = "Admin Panel (Dev Only)";

        Text user = CreateText(parent, "AdminUser", new Vector2(0, -40), 12, TextAnchor.UpperCenter);
        user.text = $"User: {playerName}";

        CreateButton(parent, "Add 1000 Coins", new Vector2(0, -80), new Vector2(180, 28), TextAnchor.UpperCenter, () =>
        {
            AddCoins(1000);
            SetAdminStatus("Added 1000 SP Coins.");
        });

        CreateButton(parent, "Add 100 Gems", new Vector2(0, -118), new Vector2(180, 28), TextAnchor.UpperCenter, () =>
        {
            AddGems(100);
            SetAdminStatus("Added 100 SP Gems.");
        });

        CreateButton(parent, "Reset Balance", new Vector2(0, -156), new Vector2(180, 28), TextAnchor.UpperCenter, () =>
        {
            spCoins = 0;
            spGems = 0;
            SaveEconomy();
            UpdateEconomyUI();
            SetAdminStatus("Balance reset.");
        });

        adminStatusText = CreateText(parent, "AdminStatus", new Vector2(0, 12), 12, TextAnchor.LowerCenter);
        adminStatusText.text = "";
    }

    private void BuildProfilePanel(Transform parent)
    {
        Text title = CreateText(parent, "ProfileTitle", new Vector2(0, -10), 18, TextAnchor.UpperCenter);
        title.text = "Profile";

        profileSummaryText = CreateText(parent, "ProfileSummary", new Vector2(16, -50), 12, TextAnchor.UpperLeft);
        RectTransform rt = profileSummaryText.rectTransform;
        rt.sizeDelta = new Vector2(280, 120);

        missionsText = CreateText(parent, "MissionsText", new Vector2(16, -110), 11, TextAnchor.UpperLeft);
        RectTransform mr = missionsText.rectTransform;
        mr.sizeDelta = new Vector2(280, 60);

        battlePassText = CreateText(parent, "BattlePassText", new Vector2(16, -150), 11, TextAnchor.UpperLeft);
        RectTransform br = battlePassText.rectTransform;
        br.sizeDelta = new Vector2(280, 24);

        CreateButton(parent, "Claim Daily", new Vector2(0, -175), new Vector2(160, 28), TextAnchor.UpperCenter, () =>
        {
            ClaimDailyReward();
        });

        CreateButton(parent, "Close", new Vector2(0, -206), new Vector2(160, 26), TextAnchor.UpperCenter, () =>
        {
            profilePanel.SetActive(false);
        });

        profileStatusText = CreateText(parent, "ProfileStatus", new Vector2(0, 12), 12, TextAnchor.LowerCenter);
        profileStatusText.text = "";
    }

    private void BuildAuthPanel(Transform parent)
    {
        Text title = CreateText(parent, "AuthTitle", new Vector2(0, -10), 18, TextAnchor.UpperCenter);
        title.text = "Cloud Login";

        Text apiLabel = CreateText(parent, "ApiLabel", new Vector2(0, -40), 12, TextAnchor.UpperCenter);
        apiLabel.text = $"API: {apiBase}";

        emailField = CreateInputField(parent, "EmailField", new Vector2(0, -80), new Vector2(260, 28), TextAnchor.UpperCenter, "Email", false);
        passwordField = CreateInputField(parent, "PasswordField", new Vector2(0, -118), new Vector2(260, 28), TextAnchor.UpperCenter, "Password", true);

        CreateButton(parent, "Login", new Vector2(0, -156), new Vector2(160, 28), TextAnchor.UpperCenter, () =>
        {
            StartCoroutine(LoginCloud());
        });

        CreateButton(parent, "Register", new Vector2(0, -190), new Vector2(160, 26), TextAnchor.UpperCenter, () =>
        {
            StartCoroutine(RegisterCloud());
        });

        authStatusText = CreateText(parent, "AuthStatus", new Vector2(0, 12), 12, TextAnchor.LowerCenter);
        authStatusText.text = "Login to enable cloud save.";
    }

    private GameObject CreatePanel(Transform parent, string name, Vector2 anchoredPos, Vector2 size, TextAnchor anchor, Color bg)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(parent, false);
        Image image = panel.AddComponent<Image>();
        image.color = bg;
        RectTransform rt = panel.GetComponent<RectTransform>();
        rt.sizeDelta = size;
        rt.anchorMin = AnchorMin(anchor);
        rt.anchorMax = AnchorMax(anchor);
        rt.pivot = Pivot(anchor);
        rt.anchoredPosition = anchoredPos;
        return panel;
    }

    private Button CreateButton(Transform parent, string label, Vector2 anchoredPos, Vector2 size, TextAnchor anchor, Action onClick)
    {
        GameObject root = new GameObject(label + "Button");
        root.transform.SetParent(parent, false);
        Image image = root.AddComponent<Image>();
        image.color = new Color(0.18f, 0.22f, 0.3f, 0.85f);

        Button button = root.AddComponent<Button>();
        button.targetGraphic = image;
        if (onClick != null) button.onClick.AddListener(() => onClick());

        RectTransform rt = root.GetComponent<RectTransform>();
        rt.sizeDelta = size;
        rt.anchorMin = AnchorMin(anchor);
        rt.anchorMax = AnchorMax(anchor);
        rt.pivot = Pivot(anchor);
        rt.anchoredPosition = anchoredPos;

        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(root.transform, false);
        Text text = labelObj.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.text = label;
        text.fontSize = 12;
        text.color = new Color(0.9f, 0.95f, 1f);
        text.alignment = TextAnchor.MiddleCenter;
        RectTransform trt = text.rectTransform;
        trt.anchorMin = Vector2.zero;
        trt.anchorMax = Vector2.one;
        trt.offsetMin = Vector2.zero;
        trt.offsetMax = Vector2.zero;

        return button;
    }

    private InputField CreateInputField(Transform parent, string name, Vector2 anchoredPos, Vector2 size, TextAnchor anchor, string placeholderText, bool isPassword)
    {
        GameObject root = new GameObject(name);
        root.transform.SetParent(parent, false);
        Image image = root.AddComponent<Image>();
        image.color = new Color(1f, 1f, 1f, 0.08f);

        RectTransform rt = root.GetComponent<RectTransform>();
        rt.sizeDelta = size;
        rt.anchorMin = AnchorMin(anchor);
        rt.anchorMax = AnchorMax(anchor);
        rt.pivot = Pivot(anchor);
        rt.anchoredPosition = anchoredPos;

        InputField input = root.AddComponent<InputField>();
        input.textComponent = CreateInputText(root.transform, "Text", TextAnchor.MiddleLeft, new Color(0.9f, 0.95f, 1f));
        input.placeholder = CreateInputText(root.transform, "Placeholder", TextAnchor.MiddleLeft, new Color(1f, 1f, 1f, 0.4f));
        (input.placeholder as Text).text = placeholderText;
        input.contentType = isPassword ? InputField.ContentType.Password : InputField.ContentType.Standard;

        return input;
    }

    private Text CreateInputText(Transform parent, string name, TextAnchor anchor, Color color)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent, false);
        Text text = go.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = 12;
        text.color = color;
        text.alignment = anchor;
        RectTransform rt = text.rectTransform;
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = new Vector2(8, 4);
        rt.offsetMax = new Vector2(-8, -4);
        return text;
    }

    private Text CreateText(Transform parent, string name, Vector2 anchoredPos, int fontSize, TextAnchor anchor)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent, false);
        Text text = go.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = fontSize;
        text.color = new Color(0.9f, 0.95f, 1f);
        text.alignment = anchor;

        RectTransform rt = text.rectTransform;
        rt.sizeDelta = new Vector2(400, 30);
        rt.anchorMin = AnchorMin(anchor);
        rt.anchorMax = AnchorMax(anchor);
        rt.pivot = Pivot(anchor);
        rt.anchoredPosition = anchoredPos;
        return text;
    }

    private VirtualJoystick CreateJoystick(Transform parent, Vector2 anchoredPos, Vector2 size, TextAnchor anchor)
    {
        GameObject root = new GameObject("Joystick");
        root.transform.SetParent(parent, false);
        RectTransform rt = root.AddComponent<RectTransform>();
        rt.sizeDelta = size;
        rt.anchorMin = AnchorMin(anchor);
        rt.anchorMax = AnchorMax(anchor);
        rt.pivot = Pivot(anchor);
        rt.anchoredPosition = anchoredPos;

        Image bg = root.AddComponent<Image>();
        bg.color = new Color(1f, 1f, 1f, 0.08f);

        GameObject knobObj = new GameObject("Knob");
        knobObj.transform.SetParent(root.transform, false);
        RectTransform knobRt = knobObj.AddComponent<RectTransform>();
        knobRt.sizeDelta = size * 0.5f;
        knobRt.anchoredPosition = Vector2.zero;
        Image knobImg = knobObj.AddComponent<Image>();
        knobImg.color = new Color(1f, 1f, 1f, 0.2f);

        VirtualJoystick joy = root.AddComponent<VirtualJoystick>();
        joy.knob = knobRt;
        joy.radius = size.x * 0.4f;
        return joy;
    }

    private Vector2 AnchorMin(TextAnchor anchor)
    {
        switch (anchor)
        {
            case TextAnchor.UpperLeft: return new Vector2(0f, 1f);
            case TextAnchor.UpperCenter: return new Vector2(0.5f, 1f);
            case TextAnchor.UpperRight: return new Vector2(1f, 1f);
            case TextAnchor.MiddleLeft: return new Vector2(0f, 0.5f);
            case TextAnchor.MiddleCenter: return new Vector2(0.5f, 0.5f);
            case TextAnchor.MiddleRight: return new Vector2(1f, 0.5f);
            case TextAnchor.LowerLeft: return new Vector2(0f, 0f);
            case TextAnchor.LowerCenter: return new Vector2(0.5f, 0f);
            case TextAnchor.LowerRight: return new Vector2(1f, 0f);
        }
        return new Vector2(0f, 0f);
    }

    private Vector2 AnchorMax(TextAnchor anchor)
    {
        return AnchorMin(anchor);
    }

    private Vector2 Pivot(TextAnchor anchor)
    {
        return AnchorMin(anchor);
    }

    private void SetColor(GameObject obj, Color color)
    {
        Renderer r = obj.GetComponent<Renderer>();
        if (r == null) return;
        Material mat = new Material(Shader.Find("Standard"));
        mat.color = color;
        r.material = mat;
    }
}
